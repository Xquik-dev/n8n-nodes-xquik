// SPDX-FileCopyrightText: 2026 Xquik Contributors
// SPDX-License-Identifier: MIT

import js from '@eslint/js';
import { n8nCommunityNodesPlugin } from '@n8n/eslint-plugin-community-nodes';
import { defineConfig, globalIgnores } from 'eslint/config';
import { createTypeScriptImportResolver } from 'eslint-import-resolver-typescript';
import importPlugin from 'eslint-plugin-import-x';
import globals from 'globals';
import { createRequire } from 'node:module';
import tseslint from 'typescript-eslint';
import { z } from 'zod/v4';
import { xquikPlugin } from './scripts/typed-bans.mts';

const ruleSet = z.object({ rules: z.record(z.string(), z.literal('error')) });
const n8nNodesBase = z
	.looseObject({ configs: z.object({ community: ruleSet, credentials: ruleSet, nodes: ruleSet }) })
	.parse(createRequire(import.meta.url)('eslint-plugin-n8n-nodes-base'));

const communityNodesRecommended = n8nCommunityNodesPlugin.configs.recommended;
const domOnlyGlobals = Object.keys(globals.browser)
	.filter((name) => !Object.hasOwn(globals.node, name))
	.map((name) => ({ name, message: 'Node code has no DOM. Use a Node or n8n API instead.' }));

export default defineConfig(
	globalIgnores(['dist']),
	{ linterOptions: { noInlineConfig: true } },
	{
		files: ['**/*.{js,jsx,mjs,cjs}'],
		rules: {
			'no-restricted-syntax': ['error', { selector: 'Program', message: 'Write this file in TypeScript.' }],
		},
	},
	{
		files: ['**/*.ts'],
		extends: [
			js.configs.recommended,
			tseslint.configs.recommended,
			communityNodesRecommended,
			importPlugin.configs['flat/recommended'],
		],
		rules: {
			'no-console': 'error',
		},
	},
	{
		plugins: { 'n8n-nodes-base': n8nNodesBase },
		settings: {
			'import-x/resolver-next': [createTypeScriptImportResolver()],
		},
	},
	{
		files: ['package.json', '**/*.node.json'],
		extends: [communityNodesRecommended],
		rules: {
			...n8nNodesBase.configs.community.rules,
		},
		languageOptions: {
			parser: tseslint.parser,
			parserOptions: {
				extraFileExtensions: ['.json'],
			},
		},
	},
	{
		files: ['./credentials/**/*.ts'],
		rules: {
			...n8nNodesBase.configs.credentials.rules,
			'n8n-nodes-base/cred-class-field-documentation-url-miscased': 'off',
		},
	},
	{
		files: ['./nodes/**/*.ts'],
		rules: {
			...n8nNodesBase.configs.nodes.rules,
			'n8n-nodes-base/node-class-description-inputs-wrong-regular-node': 'off',
			'n8n-nodes-base/node-class-description-outputs-wrong': 'off',
			'n8n-nodes-base/node-param-type-options-max-value-present': 'off',
		},
	},
	{
		files: ['**/*.{ts,tsx,mts,cts}'],
		languageOptions: {
			parser: tseslint.parser,
			parserOptions: { projectService: true, tsconfigRootDir: import.meta.dirname },
		},
		plugins: { '@typescript-eslint': tseslint.plugin, xquik: xquikPlugin },
		rules: {
			'@typescript-eslint/ban-ts-comment': [
				'error',
				{ 'ts-check': false, 'ts-expect-error': true, 'ts-ignore': true, 'ts-nocheck': true },
			],
			'@typescript-eslint/consistent-type-assertions': ['error', { assertionStyle: 'never' }],
			'@typescript-eslint/method-signature-style': ['error', 'property'],
			'@typescript-eslint/no-explicit-any': 'error',
			'@typescript-eslint/no-unsafe-argument': 'error',
			'@typescript-eslint/no-unsafe-assignment': 'error',
			'@typescript-eslint/no-unsafe-call': 'error',
			'@typescript-eslint/no-unsafe-declaration-merging': 'error',
			'@typescript-eslint/no-unsafe-member-access': 'error',
			'@typescript-eslint/no-unsafe-return': 'error',
			'@typescript-eslint/use-unknown-in-catch-callback-variable': 'error',
			'no-eval': 'error',
			'no-restricted-globals': ['error', ...domOnlyGlobals],
			'no-restricted-syntax': [
				'error',
				{ selector: 'TSDeclareFunction', message: 'Write 1 checked signature instead of overloads.' },
				{ selector: 'TSEmptyBodyFunctionExpression', message: 'Write 1 checked signature instead of overloads.' },
				{ selector: '[definite=true]', message: 'Initialize the value instead of asserting that it is set.' },
				{ selector: '[declare=true]', message: 'Give this value a checked source instead of declaring its type.' },
				{ selector: 'TSTypePredicate', message: 'Return a checked value instead of a type predicate the compiler trusts.' },
			],
			'xquik/no-any-returning-value': 'error',
			'xquik/no-code-comments': 'error',
			'xquik/no-schema-type-annotation': 'error',
			'no-warning-comments': ['error', { terms: ['type-coverage:ignore'], location: 'anywhere' }],
		},
	},
	{
		files: ['**/*.d.{ts,mts,cts}'],
		rules: {
			'no-restricted-syntax': [
				'error',
				{ selector: 'Program', message: 'Write the value in TypeScript instead of declaring its type.' },
			],
		},
	},
);
