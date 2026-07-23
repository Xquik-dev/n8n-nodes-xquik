// SPDX-FileCopyrightText: 2026 Xquik Contributors
// SPDX-License-Identifier: MIT

import assert from 'node:assert/strict';
import test from 'node:test';

import {
	addOptionalParameter,
	xquikApiRequest,
} from '../dist/nodes/Xquik/GenericFunctions.js';

const optionalParameterCases = [
	{ label: 'keeps zero', value: 0, expected: { limit: 0 } },
	{ label: 'keeps false', value: false, expected: { limit: false } },
	{ label: 'keeps text', value: 'cursor', expected: { limit: 'cursor' } },
	{ label: 'omits empty text', value: '', expected: {} },
	{ label: 'omits undefined', value: undefined, expected: {} },
];

for (const { label, value, expected } of optionalParameterCases) {
	test(`addOptionalParameter ${label}`, () => {
		const parameters = {};

		addOptionalParameter(parameters, 'limit', value);

		assert.deepEqual(parameters, expected);
	});
}

const requestCases = [
	{
		label: 'omits an empty query',
		query: {},
		expectedQuery: undefined,
	},
	{
		label: 'sends a populated query',
		query: { q: 'from:xquik', limit: 25, verifiedOnly: false },
		expectedQuery: { q: 'from:xquik', limit: 25, verifiedOnly: false },
	},
];

for (const { label, query, expectedQuery } of requestCases) {
	test(`xquikApiRequest ${label}`, async () => {
		const requests = [];
		const context = {
			helpers: {
				async httpRequestWithAuthentication(credentialName, options) {
					assert.equal(this, context);
					requests.push({ credentialName, options });
					return { ok: true };
				},
			},
			getNode() {
				return { name: 'Xquik' };
			},
		};

		const response = await xquikApiRequest.call(
			context,
			'GET',
			'/x/tweets/search',
			query,
		);

		assert.deepEqual(response, { ok: true });
		assert.equal(requests.length, 1);
		assert.deepEqual(requests[0], {
			credentialName: 'xquikApi',
			options: {
				headers: { Accept: 'application/json' },
				method: 'GET',
				url: 'https://xquik.com/api/v1/x/tweets/search',
				json: true,
				...(expectedQuery === undefined ? {} : { qs: expectedQuery }),
			},
		});
	});
}
