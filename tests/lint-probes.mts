// SPDX-FileCopyrightText: 2026 Xquik Contributors
// SPDX-License-Identifier: MIT

import { mkdtempSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { basename, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { ESLint } from 'eslint';

const root = fileURLToPath(new URL('..', import.meta.url));

export async function lintProbes(files: Readonly<Record<string, string>>): Promise<Map<string, (string | null)[]>> {
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
		return new Map(results.map(({ filePath, messages }) => [basename(filePath), messages.map(({ ruleId }) => ruleId)]));
	} finally {
		rmSync(folder, { force: true, recursive: true });
	}
}
