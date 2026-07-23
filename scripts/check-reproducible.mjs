// SPDX-FileCopyrightText: 2026 Xquik Contributors
// SPDX-License-Identifier: MIT

import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdir, mkdtemp, readdir, readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, relative } from 'node:path';

function runNpm(args) {
	const result = spawnSync('npm', args, { stdio: 'inherit' });
	if (result.error !== undefined) {
		throw result.error;
	}
	if (result.status !== 0) {
		throw new Error(`npm ${args.join(' ')} failed with status ${result.status}`);
	}
}

async function hashFiles(root, current = root) {
	const hashes = [];
	const entries = await readdir(current, { withFileTypes: true });
	entries.sort((left, right) => left.name.localeCompare(right.name));

	for (const entry of entries) {
		const path = join(current, entry.name);
		if (entry.isDirectory()) {
			hashes.push(...(await hashFiles(root, path)));
			continue;
		}
		if (entry.isFile()) {
			const digest = createHash('sha256').update(await readFile(path)).digest('hex');
			hashes.push([relative(root, path), digest]);
		}
	}

	return hashes;
}

runNpm(['run', 'build']);
const firstBuild = await hashFiles('dist');

runNpm(['run', 'build']);
const secondBuild = await hashFiles('dist');
assert.deepEqual(secondBuild, firstBuild, 'Repeated builds produced different files');

const workspace = await mkdtemp(join(tmpdir(), 'n8n-nodes-xquik-reproducible-'));
const firstPack = join(workspace, 'first');
const secondPack = join(workspace, 'second');
await mkdir(firstPack);
await mkdir(secondPack);

runNpm(['pack', '--ignore-scripts', '--pack-destination', firstPack]);
runNpm(['pack', '--ignore-scripts', '--pack-destination', secondPack]);

const packageNames = (await readdir(firstPack)).filter((name) => name.endsWith('.tgz'));
assert.equal(packageNames.length, 1, 'Expected exactly one package archive');
const [packageName] = packageNames;
assert.deepEqual(
	await readFile(join(secondPack, packageName)),
	await readFile(join(firstPack, packageName)),
	'Repeated package archives differ',
);

process.stdout.write('Build outputs and package archives are reproducible.\n');
