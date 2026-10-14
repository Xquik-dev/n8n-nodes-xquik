// SPDX-FileCopyrightText: 2026 Xquik Contributors
// SPDX-License-Identifier: MIT

import { describe, it } from 'node:test';
import { RuleTester } from 'eslint';
import tseslint from 'typescript-eslint';
import rule from '../scripts/no-code-comments.mjs';

RuleTester.describe = describe;
RuleTester.it = it;

const tester = new RuleTester({ languageOptions: { parser: tseslint.parser } });
const comment = { messageId: 'comment' };

tester.run('no-code-comments', rule, {
	valid: [
		'// SPDX-FileCopyrightText: 2026 Xquik Contributors\n// SPDX-License-Identifier: MIT\nconst a = 1;',
		'// n8n reads this field name.\n// https://docs.n8n.io/integrations/creating-nodes/build/reference/\nconst a = 1;',
		'// eslint-disable-next-line no-console\nconsole.log(1);',
		'// @ts-expect-error\nconst a: number = "1";',
		'const a = /* #__PURE__ */ make();',
		'#!/usr/bin/env node\nconst a = 1;',
	],
	invalid: [
		{ code: '// Explains the next line.\nconst a = 1;', errors: [comment] },
		{ code: 'const a = 1; // says what a is', errors: [comment] },
		{ code: 'const a = add(/* first */ 1, 2);', errors: [comment] },
		{ code: '/** Describes a helper. */\nexport function helper(): void {}', errors: [comment] },
		{ code: '// First line.\n// Second line, still no proof.\nconst a = 1;', errors: [comment, comment] },
		{ code: '// Unrelated note.\n\n// https://example.com/doc\nconst a = 1;', errors: [comment] },
	],
});
