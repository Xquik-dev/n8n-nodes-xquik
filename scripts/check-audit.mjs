// SPDX-FileCopyrightText: 2026 Xquik Contributors
// SPDX-License-Identifier: MIT

import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(process.argv[2] ?? fileURLToPath(new URL('..', import.meta.url)));
const exceptionsFile = 'audit-exceptions.json';
const maxRecheckDays = 30;
const dayMs = 24 * 60 * 60 * 1000;

const isText = (value) => typeof value === 'string' && value.trim() !== '';
const entryRules = [
	{
		field: 'advisory',
		needs: 'an "advisory" like GHSA-xxxx-xxxx-xxxx',
		isValid: (value) => /^GHSA(-[0-9a-z]{4}){3}$/.test(value),
	},
	{ field: 'package', needs: 'a "package" that names the vulnerable package', isValid: isText },
	{ field: 'reason', needs: 'a "reason" that says why the finding is acceptable', isValid: isText },
	{
		field: 'recheck',
		needs: 'a "recheck" date like 2026-11-12',
		isValid: (value) => /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(value)),
	},
];

const problems = [];

function isoDay(offsetDays) {
	return new Date(Date.now() + offsetDays * dayMs).toISOString().slice(0, 10);
}

function loadExceptions() {
	const file = join(root, exceptionsFile);
	if (!existsSync(file)) {
		return [];
	}
	const { exceptions } = JSON.parse(readFileSync(file, 'utf8'));
	if (!Array.isArray(exceptions)) {
		problems.push(`${exceptionsFile} needs an "exceptions" array. Add one, even if it is empty.`);
		return [];
	}
	return exceptions.filter((entry, index) => {
		const broken = entryRules.find(({ field, isValid }) => !isValid(entry?.[field]));
		if (broken) {
			problems.push(`${exceptionsFile} entry ${index + 1} needs ${broken.needs}.`);
		}
		return !broken;
	});
}

function auditAdvisories(extraArgs) {
	const result = spawnSync('npm', ['audit', '--json', ...extraArgs], {
		cwd: root,
		encoding: 'utf8',
		maxBuffer: 256 * 1024 * 1024,
	});
	if (result.error) {
		throw result.error;
	}
	let report;
	try {
		report = JSON.parse(result.stdout);
	} catch {
		report = undefined;
	}
	if (typeof report?.vulnerabilities !== 'object' || report.vulnerabilities === null) {
		process.stderr.write(result.stderr);
		console.error('npm audit returned no report. Run npm audit to see why.');
		process.exit(1);
	}

	const advisories = new Map();
	for (const { via, fixAvailable } of Object.values(report.vulnerabilities)) {
		for (const advisory of via.filter((item) => typeof item !== 'string')) {
			const id = advisory.url.split('/').at(-1);
			advisories.set(id, {
				label: `${id} ${advisory.name} (${advisory.severity})`,
				package: advisory.name,
				fixable: fixAvailable === true,
			});
		}
	}
	return advisories;
}

const accepted = [];
const today = isoDay(0);
const latestRecheck = isoDay(maxRecheckDays);
const exceptions = loadExceptions();
const unmatched = new Set(exceptions);
const production = auditAdvisories(['--omit=dev']);

for (const [id, { label, package: packageName, fixable }] of new Map([...auditAdvisories([]), ...production])) {
	const exception = exceptions.find((entry) => entry.advisory === id && entry.package === packageName);
	unmatched.delete(exception);

	if (production.has(id)) {
		problems.push(`${label} reaches the production tree. Upgrade the dependency that brings it.`);
	} else if (fixable) {
		const cleanup = exception ? `, then remove its ${exceptionsFile} entry` : '';
		problems.push(`${label} has a fix. Run npm audit fix${cleanup}.`);
	} else if (!exception) {
		problems.push(`${label} has no reviewed exception. Fix it, or review it into ${exceptionsFile}.`);
	} else if (exception.recheck < today) {
		problems.push(
			`The exception for ${label} expired on ${exception.recheck}. Recheck the advisory, then renew or remove the entry.`,
		);
	} else if (exception.recheck > latestRecheck) {
		problems.push(`The exception for ${label} rechecks on ${exception.recheck}. Use ${latestRecheck} or earlier.`);
	} else {
		accepted.push(`${label}. Recheck by ${exception.recheck}.`);
	}
}

for (const { advisory, package: packageName } of unmatched) {
	problems.push(
		`The exception for ${advisory} ${packageName} matches no current finding. Remove it from ${exceptionsFile}.`,
	);
}

for (const line of accepted) {
	console.log(`Accepted the reviewed exception for ${line}`);
}
if (problems.length > 0) {
	for (const line of problems) {
		console.error(`Blocked. ${line}`);
	}
	console.error('Audit failed. Follow each Blocked line above.');
	process.exit(1);
}
const count = accepted.length;
console.log(count === 0 ? 'Audit passed.' : `Audit passed with ${count} reviewed exception${count === 1 ? '' : 's'}.`);
