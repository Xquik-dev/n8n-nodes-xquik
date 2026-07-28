// SPDX-FileCopyrightText: 2026 Xquik Contributors
// SPDX-License-Identifier: MIT

import assert from 'node:assert/strict';
import test from 'node:test';

import fc from 'fast-check';

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

test('addOptionalParameter preserves supported fuzzed values', () => {
	const optionalValue = fc.oneof(
		fc.string({ maxLength: 128 }),
		fc.integer(),
		fc.boolean(),
		fc.constant(undefined),
	);

	fc.assert(
		fc.property(optionalValue, (value) => {
			const parameters = { sentinel: 'keep' };

			addOptionalParameter(parameters, 'value', value);

			assert.equal(parameters.sentinel, 'keep');
			if (value === undefined || value === '') {
				assert.equal(Object.hasOwn(parameters, 'value'), false);
				return;
			}

			assert.equal(Object.hasOwn(parameters, 'value'), true);
			assert.equal(parameters.value, value);
		}),
		{ numRuns: 500 },
	);
});

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

test('xquikApiRequest preserves bounded fuzzed query values', async () => {
	await fc.assert(
		fc.asyncProperty(
			fc.string({ maxLength: 128 }),
			fc.integer({ min: 0, max: 100 }),
			fc.boolean(),
			async (queryText, limit, verifiedOnly) => {
				const requests = [];
				const context = {
					helpers: {
						async httpRequestWithAuthentication(credentialName, options) {
							requests.push({ credentialName, options });
							return { ok: true };
						},
					},
					getNode() {
						return { name: 'Xquik' };
					},
				};
				const query = { q: queryText, limit, verifiedOnly };

				await xquikApiRequest.call(
					context,
					'GET',
					'/x/tweets/search',
					query,
				);

				assert.equal(requests.length, 1);
				assert.equal(requests[0].credentialName, 'xquikApi');
				assert.deepEqual(requests[0].options.qs, query);
			},
		),
		{ numRuns: 250 },
	);
});
