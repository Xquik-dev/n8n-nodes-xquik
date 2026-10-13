// SPDX-FileCopyrightText: 2026 Xquik Contributors
// SPDX-License-Identifier: MIT

// Fails unless the SARIF report shows 1 complete CodeQL run with no results.
// Usage: node scripts/verify-codeql.mjs <report.sarif>

import { readFile } from 'node:fs/promises';

const EXTRACTED_FILES = 'js/diagnostics/successfully-extracted-files';
const HARMLESS_LEVELS = new Set(['none', 'note']);

function list(value, name) {
	if (!Array.isArray(value) || value.length === 0) {
		throw new Error(`CodeQL report lacks ${name}.`);
	}
	return value;
}

function describe(result) {
	const location = result.locations?.[0]?.physicalLocation;
	const file = location?.artifactLocation?.uri ?? 'unknown file';
	const line = location?.region?.startLine ?? 0;
	return `${result.ruleId} ${file}:${line} ${result.message?.text ?? ''}`.trim();
}

const report = JSON.parse(await readFile(process.argv[2], 'utf8'));
const runs = list(report.runs, 'runs');
if (report.version !== '2.1.0' || runs.length !== 1) {
	throw new Error('Expected 1 SARIF 2.1.0 run.');
}
const [run] = runs;
if (!Array.isArray(run.results)) throw new Error('CodeQL report lacks results.');
if (run.results.length > 0) {
	for (const result of run.results) console.error(describe(result));
	throw new Error(`CodeQL found ${run.results.length} result(s). Fix each one.`);
}
let extracted = 0;
for (const invocation of list(run.invocations, 'invocations')) {
	if (invocation.executionSuccessful !== true) throw new Error('CodeQL invocation failed.');
	for (const notification of list(invocation.toolExecutionNotifications, 'diagnostics')) {
		if (!HARMLESS_LEVELS.has(notification.level)) {
			throw new Error(`CodeQL diagnostic needs review. ${notification.message?.text ?? ''}`.trim());
		}
		if (notification.descriptor?.id === EXTRACTED_FILES) extracted += 1;
	}
}
if (extracted === 0) throw new Error('CodeQL did not confirm extracted JavaScript files.');
console.log(`CodeQL finished with no results. Extracted JavaScript entries ${extracted}.`);
