// SPDX-FileCopyrightText: 2026 Xquik Contributors
// SPDX-License-Identifier: MIT

import { text } from 'node:stream/consumers';
import { z } from 'zod/v4';

const [packed] = z
	.array(z.object({ integrity: z.string() }))
	.min(1)
	.parse(JSON.parse(await text(process.stdin)));
process.stdout.write(packed.integrity);
