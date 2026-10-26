// SPDX-FileCopyrightText: 2026 Xquik Contributors
// SPDX-License-Identifier: MIT

import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { z } from 'zod/v4';

const root = resolve(process.argv[2] ?? fileURLToPath(new URL('..', import.meta.url)));
const exceptionsFile = 'audit-exceptions.json';
const maxRecheckDays = 30;
const dayMs = 24 * 60 * 60 * 1000;

const text = z.string().refine((value) => value.trim() !== '');
const exceptionEntry = z.object({
	advisory: z.string().regex(/^GHSA(-[0-9a-z]{4}){3}$/u),
	package: text,
	reason: text,
	recheck: z
		.string()
		.regex(/^\d{4}-\d{2}-\d{2}$/u)
		.refine((value) => !Number.isNaN(Date.parse(value))),
});
type Exception = z.infer<typeof exceptionEntry>;

const entryNeeds: Readonly<Record<keyof Exception, string>> = {
	advisory: 'an "advisory" like GHSA-xxxx-xxxx-xxxx',
	package: 'a "package" that names the vulnerable package',
	reason: 'a "reason" that says why the finding is acceptable',
	recheck: 'a "recheck" date like 2026-11-12',
};
const exceptionsList = z.object({ exceptions: z.array(z.unknown()) });
const auditReport = z.object({
	vulnerabilities: z.record(
		z.string(),
		z.object({
			via: z.array(z.union([z.string(), z.object({ url: z.string(), name: z.string(), severity: z.string() })])),
			fixAvailable: z.unknown(),
		}),
	),
});

const problems: string[] = [];

function isoDay(offsetDays: number): string {
	return new Date(Date.now() + offsetDays * dayMs).toISOString().slice(0, 10);
}

function parseJson(source: string): unknown {
	try {
		return JSON.parse(source);
	} catch {
		return undefined;
	}
}

function loadExceptions(): Exception[] {
	const file = join(root, exceptionsFile);
	if (!existsSync(file)) {
		return [];
	}
	const listed = exceptionsList.safeParse(JSON.parse(readFileSync(file, 'utf8')));
	if (!listed.success) {
		problems.push(`${exceptionsFile} needs an "exceptions" array. Add one, even if it is empty.`);
		return [];
	}
	return listed.data.exceptions.flatMap((entry, index) => {
		const parsed = exceptionEntry.safeParse(entry);
		if (parsed.success) {
			return [parsed.data];
		}
		const field = exceptionEntry.keyof().catch('advisory').parse(parsed.error.issues[0].path[0]);
		problems.push(`${exceptionsFile} entry ${index + 1} needs ${entryNeeds[field]}.`);
		return [];
	});
}

function auditAdvisories(extraArgs: readonly string[]): Map<string, { label: string; package: string; fixable: boolean }> {
	const result = spawnSync('npm', ['audit', '--json', ...extraArgs], {
		cwd: root,
		encoding: 'utf8',
		maxBuffer: 256 * 1024 * 1024,
	});
	if (result.error) {
		throw result.error;
	}
	const report = auditReport.safeParse(parseJson(result.stdout));
	if (!report.success) {
		process.stderr.write(result.stderr);
		console.error('npm audit returned no report. Run npm audit to see why.');
		process.exit(1);
	}

	const advisories = new Map<string, { label: string; package: string; fixable: boolean }>();
	for (const { via, fixAvailable } of Object.values(report.data.vulnerabilities)) {
		for (const advisory of via) {
			if (typeof advisory === 'string') {
				continue;
			}
			const id = advisory.url.slice(advisory.url.lastIndexOf('/') + 1);
			advisories.set(id, {
				label: `${id} ${advisory.name} (${advisory.severity})`,
				package: advisory.name,
				fixable: fixAvailable === true,
			});
		}
	}
	return advisories;
}

const accepted: string[] = [];
const today = isoDay(0);
const latestRecheck = isoDay(maxRecheckDays);
const exceptions = loadExceptions();
const unmatched = new Set(exceptions);
const production = auditAdvisories(['--omit=dev']);

for (const [id, { label, package: packageName, fixable }] of new Map([...auditAdvisories([]), ...production])) {
	const exception = exceptions.find((entry) => entry.advisory === id && entry.package === packageName);
	if (exception !== undefined) {
		unmatched.delete(exception);
	}

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
