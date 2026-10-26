// SPDX-FileCopyrightText: 2026 Xquik Contributors
// SPDX-License-Identifier: MIT

import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { copyFileSync, existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import test, { type TestContext } from 'node:test';
import { fileURLToPath } from 'node:url';

const script = fileURLToPath(new URL('../bin/release-local', import.meta.url));
const TOKEN = 'npm_isolated_fixture_token';

const FAKES = {
	git: `case "$1" in
  status) [ "$CASE" != dirty ] || echo ' M README.md' ;;
  symbolic-ref) if [ "$CASE" = branch ]; then echo topic; else echo main; fi ;;
  fetch) ;;
  rev-parse)
    case "$*" in
      *refs/tags/*) exit 1 ;;
      *origin/main*) if [ "$CASE" = behind ]; then echo def; else echo abc; fi ;;
      *) echo abc ;;
    esac ;;
  ls-remote) exit 2 ;;
  tag) echo "tag $3" >> "$EVENTS" ;;
  push) echo "push $3" >> "$EVENTS" ;;
  *) exit 99 ;;
esac`,
	gh: `case "$1 $2" in
  'auth status') ;;
  'release create') echo "release $3" >> "$EVENTS" ;;
  *) exit 99 ;;
esac`,
	npm: `case "$*" in
  'run build') echo build >> "$EVENTS" ;;
  'pack --dry-run --json --ignore-scripts') echo pack >> "$EVENTS"; echo '[{"integrity":"sha512-local"}]' ;;
  'view n8n-nodes-xquik versions --json') if [ "$CASE" = published ]; then echo '["1.2.2","1.2.3"]'; else echo '["1.2.2"]'; fi ;;
  'view n8n-nodes-xquik@1.2.3 dist.integrity') echo verify >> "$EVENTS"; if [ "$CASE" = differs ]; then echo sha512-other; else echo sha512-local; fi ;;
  'publish --dry-run') echo "publish dry run with RELEASE_MODE=$RELEASE_MODE" >> "$EVENTS" ;;
  'publish --userconfig '*)
    grep -q "_authToken=$EXPECTED_TOKEN" "$3" || exit 98
    echo "$3" > "$NPMRC_PATH"
    echo "publish with RELEASE_MODE=$RELEASE_MODE" >> "$EVENTS" ;;
  *) exit 99 ;;
esac`,
	security: `[ "$*" = "find-generic-password -s test-service -a test-account -w" ] || exit 44
echo read token >> "$EVENTS"
echo "$EXPECTED_TOKEN"`,
	sleep: 'echo "sleep $1" >> "$EVENTS"',
};

function release(
	t: TestContext,
	{
		args = [],
		testCase = 'ready',
		env = { NPM_KEYCHAIN_SERVICE: 'test-service', NPM_KEYCHAIN_ACCOUNT: 'test-account' },
	}: { args?: readonly string[]; testCase?: string; env?: Readonly<Record<string, string>> } = {},
): { events: string[]; last: string | undefined; status: number | null } {
	const folder = mkdtempSync(join(tmpdir(), 'n8n-xquik-release-test-'));
	t.after(() => rmSync(folder, { force: true, recursive: true }));
	const project = join(folder, 'project');
	const fakes = join(folder, 'fakes');
	for (const path of [join(project, 'bin'), join(project, 'scripts'), fakes]) mkdirSync(path, { recursive: true });
	copyFileSync(script, join(project, 'bin/release-local'));
	writeFileSync(join(project, 'package.json'), JSON.stringify({ name: 'n8n-nodes-xquik', version: '1.2.3' }));
	writeFileSync(join(project, 'bin/check-local'), '#!/bin/sh\necho checks >> "$EVENTS"\n', { mode: 0o755 });
	writeFileSync(join(project, 'scripts/check-audit.mts'), 'import { appendFileSync } from "node:fs";\nappendFileSync(process.env.EVENTS, "audit\\n");\n');
	for (const [name, body] of Object.entries(FAKES)) writeFileSync(join(fakes, name), `#!/bin/sh\n${body}\n`, { mode: 0o755 });
	const events = join(folder, 'events');
	const npmrcPath = join(folder, 'npmrc-path');
	writeFileSync(events, '');
	const result = spawnSync('/bin/bash', [join(project, 'bin/release-local'), ...args], {
		encoding: 'utf8',
		env: {
			CASE: testCase,
			EVENTS: events,
			EXPECTED_TOKEN: TOKEN,
			HOME: folder,
			NPMRC_PATH: npmrcPath,
			PATH: `${fakes}:${dirname(process.execPath)}:/usr/bin:/bin`,
			TMPDIR: folder,
			...env,
		},
	});
	const output = `${result.stdout}${result.stderr}`;
	assert.ok(!output.includes(TOKEN), 'the token reached the output');
	const npmrc = existsSync(npmrcPath) ? readFileSync(npmrcPath, 'utf8').trim() : '';
	assert.ok(npmrc === '' || !existsSync(npmrc), 'the npm config with the token was left behind');
	return { events: readFileSync(events, 'utf8').split('\n').filter(Boolean), last: output.trimEnd().split('\n').at(-1), status: result.status };
}

const CHECKED = ['checks', 'audit', 'build', 'pack'];
const RELEASED = ['verify', 'tag v1.2.3', 'push refs/tags/v1.2.3', 'release v1.2.3'];

test('a release publishes with the Keychain token, compares npm with the build, then tags', (t) => {
	const result = release(t);
	assert.equal(result.status, 0, result.last);
	assert.deepEqual(result.events, [...CHECKED, 'read token', 'publish with RELEASE_MODE=true', ...RELEASED]);
	assert.equal(result.last, 'Released n8n-nodes-xquik@1.2.3.');
});

test('a version npm already has is compared, not published again', (t) => {
	const result = release(t, { testCase: 'published' });
	assert.equal(result.status, 0, result.last);
	assert.deepEqual(result.events, [...CHECKED, ...RELEASED]);
});

for (const [testCase, events, last] of [
	['ready', [...CHECKED, 'publish dry run with RELEASE_MODE=true'], 'Dry run finished for n8n-nodes-xquik@1.2.3. Nothing was published, tagged or released.'],
	['published', CHECKED, 'Dry run finished for n8n-nodes-xquik@1.2.3, which npm already has. Nothing was tagged or released.'],
	['branch', [...CHECKED, 'publish dry run with RELEASE_MODE=true'], 'Dry run finished for n8n-nodes-xquik@1.2.3. Nothing was published, tagged or released.'],
] as const) {
	test(`a dry run in state ${testCase} reads no token and releases nothing`, (t) => {
		const result = release(t, { args: ['--dry-run'], env: {}, testCase });
		assert.equal(result.status, 0, result.last);
		assert.deepEqual(result.events, events);
		assert.equal(result.last, last);
	});
}

test('a package npm serves with another integrity is never tagged', (t) => {
	const result = release(t, { env: { NPM_KEYCHAIN_SERVICE: 'test-service', NPM_KEYCHAIN_ACCOUNT: 'test-account', RELEASE_RETRY_SECONDS: '0' }, testCase: 'differs' });
	assert.equal(result.status, 1);
	const retries = ['verify', 'sleep 0', 'verify', 'sleep 0', 'verify', 'sleep 0', 'verify', 'sleep 0', 'verify'];
	assert.deepEqual(result.events, [...CHECKED, 'read token', 'publish with RELEASE_MODE=true', ...retries]);
	assert.equal(result.last, 'Release stopped: npm serves n8n-nodes-xquik@1.2.3 with another integrity than this build, or not yet. Compare them before you tag.');
});

for (const [name, options, status, last] of [
	['an unset service', { env: { NPM_KEYCHAIN_ACCOUNT: 'test-account' } }, 1, 'Release stopped: set NPM_KEYCHAIN_SERVICE to the service of the Keychain item that holds the npm token.'],
	['an unset account', { env: { NPM_KEYCHAIN_SERVICE: 'test-service' } }, 1, 'Release stopped: set NPM_KEYCHAIN_ACCOUNT to the account of the Keychain item that holds the npm token.'],
	['a dirty tree', { testCase: 'dirty' }, 1, 'Release stopped: commit or remove local changes first.'],
	['a dirty tree in a dry run', { args: ['--dry-run'], env: {}, testCase: 'dirty' }, 1, 'Release stopped: commit or remove local changes first.'],
	['another branch', { testCase: 'branch' }, 1, 'Release stopped: switch to main first.'],
	['a main behind origin', { testCase: 'behind' }, 1, 'Release stopped: pull or push until main matches origin/main.'],
	['an unknown option', { args: ['--publish'] }, 2, 'Unknown option --publish. Run bin/release-local or bin/release-local --dry-run.'],
] as const) {
	test(`${name} stops before any upload`, (t) => {
		const result = release(t, options);
		assert.equal(result.status, status);
		assert.equal(result.last, last);
		assert.deepEqual(result.events.filter((event) => !CHECKED.includes(event)), []);
	});
}
