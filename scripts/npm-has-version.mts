// SPDX-FileCopyrightText: 2026 Xquik Contributors
// SPDX-License-Identifier: MIT

import { z } from 'zod/v4';

const versions = z.union([z.string(), z.array(z.string())]).parse(JSON.parse(process.argv[2]));
process.exit([versions].flat().includes(process.argv[3]) ? 0 : 1);
