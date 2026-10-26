// SPDX-FileCopyrightText: 2026 Xquik Contributors
// SPDX-License-Identifier: MIT

import assert from 'node:assert/strict';
import test from 'node:test';

import { lintProbes } from './lint-probes.mts';

const CASES: readonly { readonly name: string; readonly code: string; readonly flagged: number }[] = [
	{
		name: 'license',
		code: '// SPDX-FileCopyrightText: 2026 Xquik Contributors\n// SPDX-License-Identifier: MIT\nexport const a = 1;\n',
		flagged: 0,
	},
	{
		name: 'proof',
		code: '// n8n reads this field name.\n// https://docs.n8n.io/integrations/creating-nodes/build/reference/\nexport const a = 1;\n',
		flagged: 0,
	},
	{ name: 'lint-directive', code: '// eslint-disable-next-line no-console\nconsole.log(1);\n', flagged: 0 },
	{ name: 'ts-directive', code: '// @ts-expect-error\nexport const a: number = "1";\n', flagged: 0 },
	{ name: 'pure', code: 'export const a = /* #__PURE__ */ Symbol();\n', flagged: 0 },
	{ name: 'shebang', code: '#!/usr/bin/env node\nexport const a = 1;\n', flagged: 0 },
	{ name: 'narration', code: '// Explains the next line.\nexport const a = 1;\n', flagged: 1 },
	{ name: 'trailing', code: 'export const a = 1; // says what a is\n', flagged: 1 },
	{ name: 'inline', code: 'export const a = Math.max(/* first */ 1, 2);\n', flagged: 1 },
	{ name: 'doc', code: '/** Describes a helper. */\nexport function helper(): void {}\n', flagged: 1 },
	{ name: 'block', code: '// First line.\n// Second line, still no proof.\nexport const a = 1;\n', flagged: 2 },
	{ name: 'split', code: '// Unrelated note.\n\n// https://example.com/doc\nexport const a = 1;\n', flagged: 1 },
];

const rules = await lintProbes(Object.fromEntries(CASES.map(({ name, code }) => [`${name}.mts`, code])));

for (const { name, flagged } of CASES) {
	test(`no-code-comments flags ${flagged} comments in the ${name} case`, () => {
		assert.equal(rules.get(`${name}.mts`)?.filter((rule) => rule === 'xquik/no-code-comments').length, flagged);
	});
}
