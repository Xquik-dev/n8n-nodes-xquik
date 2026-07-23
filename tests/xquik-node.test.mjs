// SPDX-FileCopyrightText: 2026 Xquik Contributors
// SPDX-License-Identifier: MIT

import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import test from 'node:test';

import { Xquik } from '../dist/nodes/Xquik/Xquik.node.js';

const require = createRequire(import.meta.url);
const { NodeApiError, NodeOperationError } = require('n8n-workflow');

function createExecutionContext(parameterSets, options = {}) {
	const requests = [];
	const context = {
		continueOnFail() {
			return options.continueOnFail ?? false;
		},
		getInputData() {
			return parameterSets.map(() => ({ json: {} }));
		},
		getNode() {
			return {
				name: 'Xquik',
				type: 'xquik',
				typeVersion: 1,
				position: [0, 0],
				parameters: {},
			};
		},
		getNodeParameter(name, itemIndex) {
			if (options.parameterError !== undefined) {
				throw options.parameterError;
			}

			return parameterSets[itemIndex][name];
		},
		helpers: {
			async httpRequestWithAuthentication(credentialName, requestOptions) {
				assert.equal(this, context);
				requests.push({ credentialName, requestOptions });

				if (options.requestError !== undefined) {
					throw options.requestError;
				}

				return { ok: true };
			},
		},
	};

	return { context, requests };
}

const operationCases = [
	{
		label: 'gets credits',
		parameters: { resource: 'account', operation: 'getCredits' },
		expectedUrl: 'https://xquik.com/api/v1/credits',
	},
	{
		label: 'searches tweets with every optional field',
		parameters: {
			resource: 'tweet',
			operation: 'search',
			query: 'from:xquik',
			queryType: 'Latest',
			limit: 25,
			cursor: 'next-page',
			additionalFields: {
				fromUser: 'xquik',
				lang: 'en',
				sinceTime: '2026-01-01T00:00:00Z',
				untilTime: '2026-02-01T00:00:00Z',
				verifiedOnly: false,
			},
		},
		expectedUrl: 'https://xquik.com/api/v1/x/tweets/search',
		expectedQuery: {
			q: 'from:xquik',
			queryType: 'Latest',
			limit: 25,
			cursor: 'next-page',
			fromUser: 'xquik',
			language: 'en',
			sinceTime: '2026-01-01T00:00:00Z',
			untilTime: '2026-02-01T00:00:00Z',
			verifiedOnly: false,
		},
	},
	{
		label: 'searches users without an empty cursor',
		parameters: {
			resource: 'user',
			operation: 'search',
			query: 'xquik',
			cursor: '',
		},
		expectedUrl: 'https://xquik.com/api/v1/x/users/search',
		expectedQuery: { q: 'xquik' },
	},
	{
		label: 'gets regional trends',
		parameters: {
			resource: 'trend',
			operation: 'getAll',
			woeid: 1,
			count: 30,
		},
		expectedUrl: 'https://xquik.com/api/v1/trends',
		expectedQuery: { woeid: 1, count: 30 },
	},
	{
		label: 'checks a follow relationship',
		parameters: {
			resource: 'follow',
			operation: 'check',
			source: 'alice',
			target: 'bob',
		},
		expectedUrl: 'https://xquik.com/api/v1/x/followers/check',
		expectedQuery: { source: 'alice', target: 'bob' },
	},
];

for (const { label, parameters, expectedUrl, expectedQuery } of operationCases) {
	test(`execute ${label}`, async () => {
		const { context, requests } = createExecutionContext([parameters]);

		const result = await new Xquik().execute.call(context);

		assert.deepEqual(result, [
			[
				{
					json: { ok: true },
					pairedItem: { item: 0 },
				},
			],
		]);
		assert.equal(requests.length, 1);
		assert.deepEqual(requests[0], {
			credentialName: 'xquikApi',
			requestOptions: {
				headers: { Accept: 'application/json' },
				method: 'GET',
				url: expectedUrl,
				json: true,
				...(expectedQuery === undefined ? {} : { qs: expectedQuery }),
			},
		});
	});
}

test('execute returns stable empty data for an unsupported operation', async () => {
	const { context, requests } = createExecutionContext([
		{ resource: 'unknown', operation: 'unknown' },
	]);

	const result = await new Xquik().execute.call(context);

	assert.deepEqual(result, [[{ json: {}, pairedItem: { item: 0 } }]]);
	assert.deepEqual(requests, []);
});

test('execute preserves API errors when continue-on-fail is disabled', async () => {
	const { context } = createExecutionContext(
		[{ resource: 'account', operation: 'getCredits' }],
		{ requestError: new Error('request failed') },
	);

	await assert.rejects(() => new Xquik().execute.call(context), NodeApiError);
});

test('execute returns an error item when continue-on-fail is enabled', async () => {
	const { context } = createExecutionContext(
		[{ resource: 'account', operation: 'getCredits' }],
		{ continueOnFail: true, requestError: new Error('request failed') },
	);

	const result = await new Xquik().execute.call(context);

	assert.equal(result[0].length, 1);
	assert.equal(result[0][0].pairedItem.item, 0);
	assert.equal(typeof result[0][0].json.error, 'string');
	assert.ok(result[0][0].json.error.length > 0);
});

test('execute returns a stable fallback for non-error failures', async () => {
	const { context } = createExecutionContext(
		[{ resource: 'account', operation: 'getCredits' }],
		{ continueOnFail: true, parameterError: 'parameter failed' },
	);

	const result = await new Xquik().execute.call(context);

	assert.deepEqual(result, [
		[{ json: { error: 'Unknown error' }, pairedItem: { item: 0 } }],
	]);
});

test('execute wraps unexpected errors with item context', async () => {
	const { context } = createExecutionContext(
		[{ resource: 'account', operation: 'getCredits' }],
		{ parameterError: new Error('parameter failed') },
	);

	await assert.rejects(() => new Xquik().execute.call(context), NodeOperationError);
});
