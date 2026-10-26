// SPDX-FileCopyrightText: 2026 Xquik Contributors
// SPDX-License-Identifier: MIT

import { mkdtempSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { basename, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { ESLint } from 'eslint';
import { z } from 'zod/v4';

const root = fileURLToPath(new URL('..', import.meta.url));
const calculatedConfig = z.object({ rules: z.record(z.string(), z.array(z.unknown())) });

export async function lintProbes(
	files: Readonly<Record<string, string>>,
	configFiles: readonly string[] = [],
): Promise<{
	reported: Map<string, (string | null)[]>;
	rules: Map<string, Readonly<Record<string, readonly unknown[]>>>;
}> {
	const folder = mkdtempSync(join(tmpdir(), 'n8n-xquik-lint-'));
	try {
		symlinkSync(join(root, 'node_modules'), join(folder, 'node_modules'));
		writeFileSync(
			join(folder, 'tsconfig.json'),
			JSON.stringify({ extends: join(root, 'tsconfig.json'), include: ['**/*'] }),
		);
		for (const [file, code] of Object.entries(files)) writeFileSync(join(folder, file), code);
		const eslint = new ESLint({
			cwd: folder,
			overrideConfigFile: join(root, 'eslint.config.mts'),
			flags: ['unstable_native_nodejs_ts_config'],
		});
		const results = await eslint.lintFiles(['.']);
		const rules = new Map<string, Readonly<Record<string, readonly unknown[]>>>();
		for (const file of configFiles) {
			rules.set(file, calculatedConfig.parse(await eslint.calculateConfigForFile(join(folder, file))).rules);
		}
		return {
			reported: new Map(results.map(({ filePath, messages }) => [basename(filePath), messages.map(({ ruleId }) => ruleId)])),
			rules,
		};
	} finally {
		rmSync(folder, { force: true, recursive: true });
	}
}
