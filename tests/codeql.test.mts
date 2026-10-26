// SPDX-FileCopyrightText: 2026 Xquik Contributors
// SPDX-License-Identifier: MIT

import assert from 'node:assert/strict';
import { spawnSync, type SpawnSyncReturns } from 'node:child_process';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test, { type TestContext } from 'node:test';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
const verifier = join(root, 'scripts/verify-codeql.mts');
const script = join(root, 'scripts/codeql-security');
const extracted = { descriptor: { id: 'js/diagnostics/successfully-extracted-files' }, level: 'none' };

function folder(t: TestContext): string {
	const path = mkdtempSync(join(tmpdir(), 'n8n-xquik-codeql-test-'));
	t.after(() => rmSync(path, { force: true, recursive: true }));
	return path;
}

function report(change: Readonly<Record<string, unknown>> = {}): { runs: Record<string, unknown>[]; version: string } {
	const run = {
		invocations: [{ executionSuccessful: true, toolExecutionNotifications: [extracted] }],
		results: [],
		...change,
	};
	return { runs: [run], version: '2.1.0' };
}

function verify(t: TestContext, sarif: unknown): SpawnSyncReturns<string> {
	const file = join(folder(t), 'report.sarif');
	writeFileSync(file, JSON.stringify(sarif));
	return spawnSync(process.execPath, [verifier, file], { encoding: 'utf8' });
}

const finding = (level: string | undefined): Record<string, unknown> => ({
	level,
	locations: [{ physicalLocation: { artifactLocation: { uri: 'nodes/a.ts' }, region: { startLine: 7 } } }],
	message: { text: 'Unsafe value.' },
	ruleId: 'js/example',
});

test('a complete CodeQL run with no results passes', (t) => {
	const outcome = verify(t, report());
	assert.equal(outcome.status, 0, outcome.stderr);
	assert.equal(outcome.stdout, 'CodeQL finished with no results. Extracted JavaScript entries 1.\n');
});

for (const level of ['error', 'warning', 'note', 'none', undefined] as const) {
	test(`a CodeQL result of level ${level} fails and names its place`, (t) => {
		const outcome = verify(t, report({ results: [finding(level)] }));
		assert.equal(outcome.status, 1);
		assert.match(outcome.stderr, /^js\/example nodes\/a\.ts:7 Unsafe value\.$/mu);
		assert.match(outcome.stderr, /CodeQL found 1 result\(s\)\. Fix each one\./u);
	});
}

for (const [name, sarif, message] of [
	['no run', { runs: [], version: '2.1.0' }, 'CodeQL report lacks runs.'],
	['no results list', report({ results: undefined }), 'CodeQL report lacks results.'],
	[
		'a failed invocation',
		report({ invocations: [{ executionSuccessful: false, toolExecutionNotifications: [extracted] }] }),
		'CodeQL invocation failed.',
	],
	[
		'an error diagnostic',
		report({
			invocations: [
				{ executionSuccessful: true, toolExecutionNotifications: [extracted, { level: 'error' }] },
			],
		}),
		'CodeQL diagnostic needs review.',
	],
	[
		'no extracted files',
		report({ invocations: [{ executionSuccessful: true, toolExecutionNotifications: [{ level: 'note' }] }] }),
		'CodeQL did not confirm extracted JavaScript files.',
	],
] as const) {
	test(`a CodeQL report with ${name} fails`, (t) => {
		const outcome = verify(t, sarif);
		assert.equal(outcome.status, 1);
		assert.ok(outcome.stderr.includes(message), outcome.stderr);
	});
}

function checkVersion(t: TestContext, version: string | undefined): SpawnSyncReturns<string> {
	const codeql = join(folder(t), 'codeql');
	if (version !== undefined) {
		writeFileSync(codeql, `#!/bin/sh\n[ "$*" = "version --format=terse" ] || exit 99\necho ${version}\n`, {
			mode: 0o755,
		});
	}
	return spawnSync('/bin/bash', [script, '--version'], {
		encoding: 'utf8',
		env: { ...process.env, XQUIK_CODEQL_BIN: codeql },
	});
}

for (const version of ['2.27.0', '2.27.2', '3.0.0'] as const) {
	test(`CodeQL ${version} is accepted`, (t) => {
		const outcome = checkVersion(t, version);
		assert.equal(outcome.status, 0, outcome.stderr);
		assert.equal(outcome.stdout, `${version}\n`);
	});
}

for (const [version, message] of [
	[undefined, 'CodeQL CLI is missing. Install it with brew install --cask codeql, then rerun.'],
	['2.26.9', 'CodeQL CLI 2.26.9 is older than 2.27.0. Run brew upgrade --cask codeql.'],
] as const) {
	test(`CodeQL ${version ?? 'missing'} is refused with the next step`, (t) => {
		const outcome = checkVersion(t, version);
		assert.equal(outcome.status, 1);
		assert.equal(outcome.stderr, `${message}\n`);
	});
}
