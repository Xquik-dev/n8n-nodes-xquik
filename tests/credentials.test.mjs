// SPDX-FileCopyrightText: 2026 Xquik Contributors
// SPDX-License-Identifier: MIT

import assert from 'node:assert/strict';
import test from 'node:test';

import { XquikApi } from '../dist/credentials/XquikApi.credentials.js';

test('credential metadata preserves authentication and documentation contracts', () => {
	const credential = new XquikApi();

	assert.equal(credential.name, 'xquikApi');
	assert.equal(credential.displayName, 'Xquik API');
	assert.equal(
		credential.documentationUrl,
		'https://docs.xquik.com/api-reference/authentication',
	);
	assert.deepEqual(credential.authenticate, {
		type: 'generic',
		properties: {
			headers: {
				'x-api-key': '={{ $credentials.apiKey }}',
			},
		},
	});
	assert.deepEqual(credential.test, {
		request: {
			method: 'GET',
			url: 'https://xquik.com/api/v1/credits',
		},
	});
	assert.equal(credential.properties[0]?.typeOptions?.password, true);
});
