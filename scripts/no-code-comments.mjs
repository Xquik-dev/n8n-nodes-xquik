// SPDX-FileCopyrightText: 2026 Xquik Contributors
// SPDX-License-Identifier: MIT

const proof = /https:\/\/|SPDX-/u;
const directive =
	/^\s*(?:eslint-disable(?:-next-line|-line)?|eslint-enable|eslint|globals?|exported)(?:\s|$)|^\s*@ts-(?:check|nocheck|expect-error|ignore)\b|^\s*prettier-ignore\b|^\s*(?:c8|v8|istanbul|node:coverage) ignore\b|^\/\s*<reference\s|^\*\s*@type\s*\{|[#@]__(?:PURE|NO_SIDE_EFFECTS)__/u;

function adjacent(sourceCode, earlier, later) {
	return /^[^\S\n]*\n?[^\S\n]*$/u.test(sourceCode.text.slice(earlier.range[1], later.range[0]));
}

export default {
	meta: {
		type: 'problem',
		docs: {
			description: 'Allow only comments with a legal marker, a functional directive or an https proof link.',
		},
		messages: {
			comment: 'Code has no comments. Put the meaning in names, types and tests.',
		},
		schema: [],
	},
	create(context) {
		const sourceCode = context.sourceCode;
		return {
			Program() {
				const comments = sourceCode.getAllComments().filter((comment) => comment.type !== 'Shebang');
				const proven = comments.map(() => false);
				for (let index = comments.length - 1; index >= 0; index -= 1) {
					const next = comments[index + 1];
					proven[index] =
						proof.test(comments[index].value) ||
						(next !== undefined && proven[index + 1] && adjacent(sourceCode, comments[index], next));
				}
				comments.forEach((comment, index) => {
					if (!proven[index] && !directive.test(comment.value)) {
						context.report({ loc: comment.loc, messageId: 'comment' });
					}
				});
			},
		};
	},
};
