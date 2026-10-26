// SPDX-FileCopyrightText: 2026 Xquik Contributors
// SPDX-License-Identifier: MIT

import assert from 'node:assert/strict';
import test from 'node:test';

import { XquikApi } from '../dist/credentials/XquikApi.credentials.js';
import { Xquik } from '../dist/nodes/Xquik/Xquik.node.js';

const PUNCTUATION = /[:;](\s|$)/;

function listStrings(value: unknown): string[] {
	if (typeof value === 'string') {
		return [value];
	}
	if (value === null || typeof value !== 'object') {
		return [];
	}
	return Object.values(value).flatMap((entry: unknown) => listStrings(entry));
}

const subjects = [
	{ label: 'node', value: new Xquik().description },
	{ label: 'credential', value: new XquikApi() },
];

for (const { label, value } of subjects) {
	test(`${label} text has no colon or semicolon as punctuation`, () => {
		assert.deepEqual(
			listStrings(value).filter((text) => PUNCTUATION.test(text)),
			[],
		);
	});
}
