// SPDX-FileCopyrightText: 2026 Xquik Contributors
// SPDX-License-Identifier: MIT

import { ESLintUtils, type TSESTree } from '@typescript-eslint/utils';

const proof = /https:\/\/|SPDX-/u;
const directive =
	/^\s*(?:eslint-disable(?:-next-line|-line)?|eslint-enable|eslint|globals?|exported)(?:\s|$)|^\s*@ts-(?:check|nocheck|expect-error|ignore)\b|^\s*prettier-ignore\b|^\s*(?:c8|v8|istanbul|node:coverage) ignore\b|^\/\s*<reference\s|^\*\s*@type\s*\{|[#@]__(?:PURE|NO_SIDE_EFFECTS)__/u;

function adjacent(text: string, earlier: TSESTree.Comment, later: TSESTree.Comment): boolean {
	return /^[^\S\n]*\n?[^\S\n]*$/u.test(text.slice(earlier.range[1], later.range[0]));
}

export const noCodeComments = ESLintUtils.RuleCreator.withoutDocs({
	meta: {
		type: 'problem',
		messages: {
			comment: 'Code has no comments. Put the meaning in names, types and tests.',
		},
		schema: [],
	},
	defaultOptions: [],
	create(context) {
		return {
			Program(): void {
				const { sourceCode } = context;
				const comments = sourceCode
					.getAllComments()
					.filter((comment) => comment.range[0] !== 0 || !sourceCode.text.startsWith('#!'));
				const proven = comments.map(() => false);
				for (let index = comments.length - 1; index >= 0; index -= 1) {
					const comment = comments[index];
					const next = comments[index + 1];
					proven[index] =
						proof.test(comment.value) ||
						(next !== undefined && proven[index + 1] === true && adjacent(sourceCode.text, comment, next));
				}
				comments.forEach((comment, index) => {
					if (proven[index] !== true && !directive.test(comment.value)) {
						context.report({ loc: comment.loc, messageId: 'comment' });
					}
				});
			},
		};
	},
});
