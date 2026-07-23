// SPDX-FileCopyrightText: 2026 Xquik Contributors
// SPDX-License-Identifier: MIT

if (process.env.RELEASE_MODE !== 'true') {
	throw new Error('Direct publishing is disabled. Publish a verified GitHub release instead.');
}
