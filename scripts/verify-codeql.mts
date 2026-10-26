// SPDX-FileCopyrightText: 2026 Xquik Contributors
// SPDX-License-Identifier: MIT

import { readFile } from 'node:fs/promises';
import { z } from 'zod/v4';

const EXTRACTED_FILES = 'js/diagnostics/successfully-extracted-files';
const HARMLESS_LEVELS = new Set(['none', 'note']);

const text = z.object({ text: z.string().optional() });
const sarifResult = z.object({
	ruleId: z.string().optional(),
	message: text.optional(),
	locations: z
		.array(
			z.object({
				physicalLocation: z
					.object({
						artifactLocation: z.object({ uri: z.string().optional() }).optional(),
						region: z.object({ startLine: z.number().optional() }).optional(),
					})
					.optional(),
			}),
		)
		.optional(),
});
const sarifNotification = z.object({
	level: z.string().optional(),
	descriptor: z.object({ id: z.string() }).optional(),
	message: text.optional(),
});
const sarifInvocation = z.object({ executionSuccessful: z.unknown(), toolExecutionNotifications: z.unknown() });
const sarifRun = z.object({ invocations: z.unknown(), results: z.unknown() });
const sarifReport = z.object({ runs: z.unknown(), version: z.unknown() });

function list(value: unknown, name: string): unknown[] {
	const parsed = z.array(z.unknown()).min(1).safeParse(value);
	if (!parsed.success) {
		throw new Error(`CodeQL report lacks ${name}.`);
	}
	return parsed.data;
}

function describe(result: z.infer<typeof sarifResult>): string {
	const location = result.locations?.[0]?.physicalLocation;
	const file = location?.artifactLocation?.uri ?? 'unknown file';
	const line = location?.region?.startLine ?? 0;
	return `${result.ruleId} ${file}:${line} ${result.message?.text ?? ''}`.trim();
}

const report = sarifReport.parse(JSON.parse(await readFile(process.argv[2], 'utf8')));
const runs = list(report.runs, 'runs');
if (report.version !== '2.1.0' || runs.length !== 1) {
	throw new Error('Expected 1 SARIF 2.1.0 run.');
}
const run = sarifRun.parse(runs[0]);
const results = z.array(sarifResult).safeParse(run.results);
if (!results.success) throw new Error('CodeQL report lacks results.');
if (results.data.length > 0) {
	for (const result of results.data) console.error(describe(result));
	throw new Error(`CodeQL found ${results.data.length} result(s). Fix each one.`);
}
let extracted = 0;
for (const invocation of list(run.invocations, 'invocations')) {
	const { executionSuccessful, toolExecutionNotifications } = sarifInvocation.parse(invocation);
	if (executionSuccessful !== true) throw new Error('CodeQL invocation failed.');
	for (const notification of list(toolExecutionNotifications, 'diagnostics')) {
		const { level, descriptor, message } = sarifNotification.parse(notification);
		if (level === undefined || !HARMLESS_LEVELS.has(level)) {
			throw new Error(`CodeQL diagnostic needs review. ${message?.text ?? ''}`.trim());
		}
		if (descriptor?.id === EXTRACTED_FILES) extracted += 1;
	}
}
if (extracted === 0) throw new Error('CodeQL did not confirm extracted JavaScript files.');
console.log(`CodeQL finished with no results. Extracted JavaScript entries ${extracted}.`);
