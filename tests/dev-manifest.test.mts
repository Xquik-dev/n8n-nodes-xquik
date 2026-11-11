// SPDX-FileCopyrightText: 2026 Xquik Contributors
// SPDX-License-Identifier: MIT

import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { z } from 'zod/v4';

const manifest = z.looseObject({
	devDependencies: z.record(z.string(), z.string()),
	overrides: z.unknown().optional(),
	private: z.boolean().optional(),
});

function read(path: string): z.infer<typeof manifest> {
	return manifest.parse(JSON.parse(readFileSync(new URL(`../${path}`, import.meta.url), 'utf8')));
}

const published = read('package.json');
const development = read('dev/package.json');

test('the published package.json lists the same development dependencies the dev tree installs', () => {
	assert.deepEqual(published.devDependencies, development.devDependencies);
});

test('only the private dev manifest holds overrides', () => {
	assert.deepEqual(
		{ published: published.overrides, private: development.private, overrides: development.overrides !== undefined },
		{ published: undefined, private: true, overrides: true },
	);
});
