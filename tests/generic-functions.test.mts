// SPDX-FileCopyrightText: 2026 Xquik Contributors
// SPDX-License-Identifier: MIT

import assert from 'node:assert/strict';
import test from 'node:test';

import type { IHttpRequestOptions } from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow/dist/cjs/index.js';

import { addOptionalParameter, xquikApiRequest } from '../dist/nodes/Xquik/GenericFunctions.js';

type RequestContext = ThisParameterType<typeof xquikApiRequest>;

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

function createContext(response: unknown): {
	context: RequestContext;
	requests: { credentialName: string; options: IHttpRequestOptions }[];
} {
	const requests: { credentialName: string; options: IHttpRequestOptions }[] = [];
	const context: RequestContext = {
		helpers: {
			async httpRequestWithAuthentication(credentialName, options) {
				assert.equal(this, context);
				requests.push({ credentialName, options });
				return response;
			},
		},
		getNode() {
			return { id: 'xquik', name: 'Xquik', type: 'xquik', typeVersion: 1, position: [0, 0], parameters: {} };
		},
	};
	return { context, requests };
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
		const { context, requests } = createContext({ ok: true });

		const response = await xquikApiRequest.call(context, 'GET', '/x/tweets/search', query);

		assert.deepEqual(response, { ok: true });
		assert.deepEqual(requests, [
			{
				credentialName: 'xquikApi',
				options: {
					headers: { Accept: 'application/json' },
					method: 'GET',
					url: 'https://xquik.com/api/v1/x/tweets/search',
					json: true,
					...(expectedQuery === undefined ? {} : { qs: expectedQuery }),
				},
			},
		]);
	});
}

for (const [label, response] of [
	['null', null],
	['a list', [{ ok: true }]],
	['text', 'ok'],
	['an object with a bigint', { count: BigInt(1) }],
	['an object with a symbol', { id: Symbol('id') }],
] as const) {
	test(`xquikApiRequest rejects ${label} as the response`, async () => {
		const { context } = createContext(response);

		await assert.rejects(() => xquikApiRequest.call(context, 'GET', '/credits'), NodeOperationError);
	});
}
