// SPDX-FileCopyrightText: 2026 Xquik Contributors
// SPDX-License-Identifier: MIT

import assert from 'node:assert/strict';
import test from 'node:test';

import { lintProbes } from './lint-probes.mts';

const ANY_VALUE = 'xquik/no-any-returning-value';
const SCHEMA_TYPE = 'xquik/no-schema-type-annotation';
const BOX = 'import { z } from "zod/v4";\ntype Box = { n: number };\n';
const BOX_SCHEMA = 'z.looseObject({ n: z.number() });\n';

const CASES: readonly { readonly file: string; readonly code: string; readonly rule: string }[] = [
	{
		file: 'inline-config.mts',
		code: '/* eslint-disable */\nexport const n = JSON.parse("1") as number;\n',
		rule: '@typescript-eslint/consistent-type-assertions',
	},
	{ file: 'javascript.mjs', code: 'export const a = 1;\n', rule: 'no-restricted-syntax' },
	{ file: 'declaration.d.ts', code: 'export type Box = { readonly n: number };\n', rule: 'no-restricted-syntax' },
	{ file: 'node-assertion.ts', code: 'export const s = 1 as unknown as string;\n', rule: '@typescript-eslint/consistent-type-assertions' },
	{
		file: 'node-ts-expect-error.ts',
		code: '// @ts-expect-error because the probe needs it\nexport const a: string = 1;\n',
		rule: '@typescript-eslint/ban-ts-comment',
	},
	{ file: 'ts-ignore.mts', code: '// @ts-ignore\nexport const a = 1;\n', rule: '@typescript-eslint/ban-ts-comment' },
	{
		file: 'ts-expect-error.mts',
		code: '// @ts-expect-error\nexport const a: string = 1;\n',
		rule: '@typescript-eslint/ban-ts-comment',
	},
	{ file: 'ts-nocheck.mts', code: '// @ts-nocheck\nexport const a = 1;\n', rule: '@typescript-eslint/ban-ts-comment' },
	{
		file: 'assertion.mts',
		code: 'export const s = 1 as unknown as string;\n',
		rule: '@typescript-eslint/consistent-type-assertions',
	},
	{
		file: 'method-signature.mts',
		code: 'export type Sink<T> = { put(v: T): void };\n',
		rule: '@typescript-eslint/method-signature-style',
	},
	{ file: 'explicit-any.mts', code: 'export const x: any = 1;\n', rule: '@typescript-eslint/no-explicit-any' },
	{
		file: 'unsafe-argument.mts',
		code: 'export const n = Math.abs(JSON.parse("1"));\n',
		rule: '@typescript-eslint/no-unsafe-argument',
	},
	{
		file: 'unsafe-assignment.mts',
		code: 'export const n: number = JSON.parse("1");\n',
		rule: '@typescript-eslint/no-unsafe-assignment',
	},
	{ file: 'unsafe-call.mts', code: 'JSON.parse("1")();\n', rule: '@typescript-eslint/no-unsafe-call' },
	{
		file: 'unsafe-declaration-merging.mts',
		code: 'export class Box {}\nexport interface Box {\n\treadonly n: number;\n}\n',
		rule: '@typescript-eslint/no-unsafe-declaration-merging',
	},
	{
		file: 'unsafe-member-access.mts',
		code: 'export const n: unknown = JSON.parse("{}").n;\n',
		rule: '@typescript-eslint/no-unsafe-member-access',
	},
	{
		file: 'unsafe-return.mts',
		code: 'export function read() {\n\treturn JSON.parse("1");\n}\n',
		rule: '@typescript-eslint/no-unsafe-return',
	},
	{
		file: 'catch-callback.mts',
		code: 'export const m = Promise.reject(new Error("x")).catch((e: Error) => e.message);\n',
		rule: '@typescript-eslint/use-unknown-in-catch-callback-variable',
	},
	{ file: 'eval.mts', code: 'eval("1");\n', rule: 'no-eval' },
	{
		file: 'overload.mts',
		code: 'export function f(a: string): string;\nexport function f(a: unknown): unknown {\n\treturn a;\n}\n',
		rule: 'no-restricted-syntax',
	},
	{
		file: 'method-overload.mts',
		code: 'export class C {\n\tm(a: string): string;\n\tm(a: unknown): unknown {\n\t\treturn a;\n\t}\n}\n',
		rule: 'no-restricted-syntax',
	},
	{ file: 'definite.mts', code: 'let v!: number;\nv = 1;\nexport { v };\n', rule: 'no-restricted-syntax' },
	{ file: 'declare.mts', code: 'declare const x: number;\nexport { x };\n', rule: 'no-restricted-syntax' },
	{
		file: 'type-predicate.mts',
		code: 'export const isText = (value: unknown): value is string => value !== undefined;\n',
		rule: 'no-restricted-syntax',
	},
	{ file: 'dom-global.mts', code: 'export const title = document.title;\n', rule: 'no-restricted-globals' },
	{
		file: 'type-coverage-ignore.mts',
		code: '// type-coverage:ignore-next-line https://github.com/plantain-00/type-coverage\nexport const a = 1;\n',
		rule: 'no-warning-comments',
	},
	{ file: 'code-comment.mts', code: '// Explains the next line.\nexport const a = 1;\n', rule: 'xquik/no-code-comments' },
	{ file: 'destructured-assign.mts', code: 'const { assign } = Object;\nexport const a = assign;\n', rule: ANY_VALUE },
	{ file: 'computed-assign.mts', code: 'export const a = Object["assign"];\n', rule: ANY_VALUE },
	{ file: 'global-assign.mts', code: 'export const a = globalThis.Object.assign;\n', rule: ANY_VALUE },
	{
		file: 'renamed-import.mts',
		code: 'import { runInNewContext as run } from "node:vm";\nexport const r = run;\n',
		rule: ANY_VALUE,
	},
	{
		file: 'computed-import.mts',
		code: 'import vm from "node:vm";\nexport const r = vm["runInNewContext"];\n',
		rule: ANY_VALUE,
	},
	{
		file: 'from-entries.mts',
		code: 'const build: (e: [string, string][]) => { n: number } = Object.fromEntries;\nexport const n: number = build([["n", "text"]]).n;\n',
		rule: ANY_VALUE,
	},
	{
		file: 'destructured-parse.mts',
		code: 'const { parse } = JSON;\nexport const f: (s: string) => number = parse;\n',
		rule: ANY_VALUE,
	},
	{ file: 'require.mts', code: 'export const load = require;\n', rule: ANY_VALUE },
	{
		file: 'promise-any.mts',
		code: 'export const read = (r: Response): (() => Promise<{ n: number }>) => r.json.bind(r);\n',
		rule: ANY_VALUE,
	},
	{
		file: 'imported-zod-type.mts',
		code: `import { type ZodType } from "zod/v4";\n${BOX}export const s: ZodType<Box> = ${BOX_SCHEMA}`,
		rule: SCHEMA_TYPE,
	},
	{
		file: 'namespace-zod-type.mts',
		code: `import * as zod from "zod/v4";\n${BOX}export const s: zod.ZodType<Box> = ${BOX_SCHEMA}`,
		rule: SCHEMA_TYPE,
	},
	{
		file: 'zod-schema.mts',
		code: 'import { z } from "zod";\ntype Box = { n: number };\nexport const s: z.ZodSchema<Box> = z.object({ n: z.number() });\n',
		rule: SCHEMA_TYPE,
	},
	{
		file: 'zod-v3-type.mts',
		code: 'import { z as v3 } from "zod/v3";\ntype Box = { n: number };\nexport const s: v3.ZodType<Box> = v3.object({ n: v3.number() });\n',
		rule: SCHEMA_TYPE,
	},
];

const ALLOWED = `import { runInNewContext } from "node:vm";
import { z } from "zod/v4";
const box = ${BOX_SCHEMA}export type Box = z.infer<typeof box>;
export const parsed: Box = box.parse({ n: 1 });
export const merged = Object.assign({}, { a: 1 });
export const keys = Object.keys({ a: 1 });
export const value: unknown = JSON.parse("1");
export const result: unknown = runInNewContext("1");
export const pair = [1, "a"] as const;
export const abs = Math.abs;
const { keys: names } = Object;
export const named = names({ a: 1 });
export const isObject = (v: unknown): boolean => v instanceof Object || typeof Array === "function";
`;

const { reported, rules } = await lintProbes(
	{ 'allowed.mts': ALLOWED, ...Object.fromEntries(CASES.map(({ file, code }) => [file, code])) },
	['probe.mts', 'probe.mjs'],
);

test('the bans report nothing in code that types every value', () => {
	assert.deepEqual(reported.get('allowed.mts'), []);
});

for (const { file, rule } of CASES) {
	test(`the bans report ${rule} in ${file}`, () => {
		assert.ok(reported.get(file)?.includes(rule), `${file} reported ${JSON.stringify(reported.get(file))}`);
	});
}

for (const extension of ['.mts', '.mjs']) {
	test(`every ban on ${extension} files has a probe row`, () => {
		const rows = CASES.filter(({ file }) => file.endsWith(extension));
		const enabled = Object.entries(rules.get(`probe${extension}`) ?? {}).filter(([, [severity]]) => severity === 2);
		assert.deepEqual(
			enabled.map(([rule]) => rule).filter((rule) => !rows.some((row) => row.rule === rule)),
			[],
		);
		const selectors = enabled.find(([rule]) => rule === 'no-restricted-syntax')?.[1].length ?? 1;
		assert.equal(rows.filter(({ rule }) => rule === 'no-restricted-syntax').length, selectors - 1);
	});
}
