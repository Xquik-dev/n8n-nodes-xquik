// SPDX-FileCopyrightText: 2026 Xquik Contributors
// SPDX-License-Identifier: MIT

import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { chmodSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { delimiter, join } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const script = fileURLToPath(new URL('../scripts/check-audit.mjs', import.meta.url));
const DAY_MS = 24 * 60 * 60 * 1000;
const ADVISORY = 'GHSA-aaaa-bbbb-cccc';

function day(offset) {
	return new Date(Date.now() + offset * DAY_MS).toISOString().slice(0, 10);
}

function finding(overrides = {}) {
	return { id: ADVISORY, name: 'leftpad', severity: 'moderate', fixAvailable: false, ...overrides };
}

function listed(overrides = {}) {
	return {
		advisory: ADVISORY,
		package: 'leftpad',
		reason: 'The test tool brings it, and the package ships none of it.',
		recheck: day(10),
		...overrides,
	};
}

// Shapes findings as npm audit --json does. A package lists its advisories under "via",
// and a package that depends on it lists that package's name there.
function auditReport(findings) {
	const vulnerabilities = {};
	for (const { id, name, severity, fixAvailable } of findings) {
		vulnerabilities[name] ??= { name, severity, via: [], fixAvailable };
		vulnerabilities[name].via.push({ name, severity, url: `https://github.com/advisories/${id}` });
		vulnerabilities[`${name}-user`] = { name: `${name}-user`, severity, via: [name], fixAvailable };
	}
	return JSON.stringify({ auditReportVersion: 2, vulnerabilities });
}

// Answers npm audit from audit.json, or from production-audit.json for --omit=dev.
// It exits 1 when it reports a finding, as npm does.
const fakeNpm = `#!/usr/bin/env node
const { readFileSync } = require('node:fs');
const file = process.argv.includes('--omit=dev') ? 'production-audit.json' : 'audit.json';
const report = readFileSync(file, 'utf8');
process.stdout.write(report);
process.exit(report.includes('GHSA-') ? 1 : 0);
`;

function runAudit({ findings = [], productionFindings = [], exceptions, report = auditReport(findings) }) {
	const root = mkdtempSync(join(tmpdir(), 'check-audit-'));
	try {
		const bin = join(root, 'bin');
		mkdirSync(bin);
		writeFileSync(join(bin, 'npm'), fakeNpm);
		chmodSync(join(bin, 'npm'), 0o755);
		writeFileSync(join(root, 'audit.json'), report);
		writeFileSync(join(root, 'production-audit.json'), auditReport(productionFindings));
		if (exceptions !== undefined) {
			writeFileSync(join(root, 'audit-exceptions.json'), JSON.stringify({ exceptions }));
		}
		const result = spawnSync(process.execPath, [script, root], {
			encoding: 'utf8',
			env: { ...process.env, PATH: `${bin}${delimiter}${process.env.PATH}` },
		});
		return { status: result.status, output: `${result.stdout}${result.stderr}` };
	} finally {
		rmSync(root, { recursive: true, force: true });
	}
}

function assertBlocked(result, line) {
	assert.equal(result.status, 1);
	assert.ok(result.output.includes(`Blocked. ${line}\n`), result.output);
	assert.ok(result.output.endsWith('Audit failed. Follow each Blocked line above.\n'), result.output);
}

test('check-audit passes when npm audit reports nothing', () => {
	assert.deepEqual(runAudit({}), { status: 0, output: 'Audit passed.\n' });
});

for (const severity of ['info', 'low', 'moderate', 'high', 'critical']) {
	test(`check-audit fails on a ${severity} finding that nobody reviewed`, () => {
		assertBlocked(
			runAudit({ findings: [finding({ severity })] }),
			`${ADVISORY} leftpad (${severity}) has no reviewed exception. Fix it, or review it into audit-exceptions.json.`,
		);
	});
}

for (const { label, recheck } of [
	{ label: 'today', recheck: day(0) },
	{ label: '30 days out', recheck: day(30) },
]) {
	test(`check-audit passes a listed development finding that rechecks ${label}`, () => {
		assert.deepEqual(runAudit({ findings: [finding()], exceptions: [listed({ recheck })] }), {
			status: 0,
			output:
				`Accepted the reviewed exception for ${ADVISORY} leftpad (moderate). Recheck by ${recheck}.\n` +
				'Audit passed with 1 reviewed exception.\n',
		});
	});
}

test('check-audit matches each advisory of 1 package to its own exception', () => {
	const second = 'GHSA-dddd-eeee-ffff';
	const result = runAudit({
		findings: [finding(), finding({ id: second, severity: 'high' })],
		exceptions: [listed(), listed({ advisory: second })],
	});

	assert.equal(result.status, 0);
	assert.ok(result.output.endsWith('Audit passed with 2 reviewed exceptions.\n'), result.output);
});

test('check-audit fails when a listed exception has expired', () => {
	assertBlocked(
		runAudit({ findings: [finding()], exceptions: [listed({ recheck: day(-1) })] }),
		`The exception for ${ADVISORY} leftpad (moderate) expired on ${day(-1)}. ` +
			'Recheck the advisory, then renew or remove the entry.',
	);
});

test('check-audit refuses a recheck date more than 30 days out', () => {
	assertBlocked(
		runAudit({ findings: [finding()], exceptions: [listed({ recheck: day(31) })] }),
		`The exception for ${ADVISORY} leftpad (moderate) rechecks on ${day(31)}. Use ${day(30)} or earlier.`,
	);
});

test('check-audit fails on a finding in the production tree, even when it is listed', () => {
	assertBlocked(
		runAudit({ findings: [finding()], productionFindings: [finding()], exceptions: [listed()] }),
		`${ADVISORY} leftpad (moderate) reaches the production tree. Upgrade the dependency that brings it.`,
	);
});

test('check-audit fails on a finding that npm audit fix resolves, even when it is listed', () => {
	assertBlocked(
		runAudit({ findings: [finding({ fixAvailable: true })], exceptions: [listed()] }),
		`${ADVISORY} leftpad (moderate) has a fix. Run npm audit fix, then remove its audit-exceptions.json entry.`,
	);
});

test('check-audit fails on an exception that matches no current finding', () => {
	assertBlocked(
		runAudit({ exceptions: [listed()] }),
		`The exception for ${ADVISORY} leftpad matches no current finding. Remove it from audit-exceptions.json.`,
	);
});

test('check-audit ignores an exception that names another package', () => {
	const result = runAudit({ findings: [finding()], exceptions: [listed({ package: 'rightpad' })] });

	assertBlocked(
		result,
		`${ADVISORY} leftpad (moderate) has no reviewed exception. Fix it, or review it into audit-exceptions.json.`,
	);
	assertBlocked(
		result,
		`The exception for ${ADVISORY} rightpad matches no current finding. Remove it from audit-exceptions.json.`,
	);
});

for (const { field, needs } of [
	{ field: 'advisory', needs: 'an "advisory" like GHSA-xxxx-xxxx-xxxx' },
	{ field: 'package', needs: 'a "package" that names the vulnerable package' },
	{ field: 'reason', needs: 'a "reason" that says why the finding is acceptable' },
	{ field: 'recheck', needs: 'a "recheck" date like 2026-11-12' },
]) {
	test(`check-audit refuses an exception without a valid ${field}`, () => {
		assertBlocked(
			runAudit({ findings: [finding()], exceptions: [listed({ [field]: '' })] }),
			`audit-exceptions.json entry 1 needs ${needs}.`,
		);
	});
}

test('check-audit fails when npm audit returns no report', () => {
	assert.deepEqual(runAudit({ report: 'npm could not reach the registry' }), {
		status: 1,
		output: 'npm audit returned no report. Run npm audit to see why.\n',
	});
});
