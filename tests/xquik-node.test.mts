// SPDX-FileCopyrightText: 2026 Xquik Contributors
// SPDX-License-Identifier: MIT

import assert from 'node:assert/strict';
import test from 'node:test';

import type { IDataObject, IHttpRequestOptions, INode, NodeParameterValue } from 'n8n-workflow';
import { NodeApiError, NodeOperationError } from 'n8n-workflow/dist/cjs/index.js';

import { Xquik } from '../dist/nodes/Xquik/Xquik.node.js';

type ExecuteContext = ThisParameterType<Xquik['execute']>;
type ItemParameters = Readonly<Record<string, NodeParameterValue>>;

const NODE: INode = { id: 'xquik', name: 'Xquik', type: 'xquik', typeVersion: 1, position: [0, 0], parameters: {} };

function apiError(): NodeApiError {
	return new NodeApiError(
		{ id: 'xquik', name: 'Xquik', type: 'xquik', typeVersion: 1, position: [0, 0], parameters: {} },
		{ message: 'Request failed.' },
	);
}

function createExecutionContext(
	parameterSets: readonly ItemParameters[],
	options: { continueOnFail?: boolean; parameterError?: unknown; requestError?: unknown } = {},
): { context: ExecuteContext; requests: { credentialName: string; requestOptions: IHttpRequestOptions }[] } {
	const requests: { credentialName: string; requestOptions: IHttpRequestOptions }[] = [];
	const context: ExecuteContext = {
		continueOnFail() {
			return options.continueOnFail ?? false;
		},
		getInputData() {
			return parameterSets.map(() => ({ json: {} }));
		},
		getNode() {
			return NODE;
		},
		getNodeParameter(name, itemIndex, fallbackValue) {
			if (options.parameterError !== undefined) {
				throw options.parameterError;
			}
			const value = parameterSets[itemIndex][name];
			return value === undefined ? fallbackValue : value;
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

const operationCases: readonly {
	label: string;
	parameters: ItemParameters;
	expectedUrl: string;
	expectedQuery?: IDataObject;
}[] = [
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
			'additionalFields.fromUser': 'xquik',
			'additionalFields.lang': 'en',
			'additionalFields.sinceTime': '2026-01-01T00:00:00Z',
			'additionalFields.untilTime': '2026-02-01T00:00:00Z',
			'additionalFields.verifiedOnly': false,
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
		label: 'searches tweets without optional fields',
		parameters: {
			resource: 'tweet',
			operation: 'search',
			query: 'from:xquik',
			queryType: 'Top',
			limit: 10,
			cursor: '',
		},
		expectedUrl: 'https://xquik.com/api/v1/x/tweets/search',
		expectedQuery: { q: 'from:xquik', queryType: 'Top', limit: 10 },
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
		assert.deepEqual(requests, [
			{
				credentialName: 'xquikApi',
				requestOptions: {
					headers: { Accept: 'application/json' },
					method: 'GET',
					url: expectedUrl,
					json: true,
					...(expectedQuery === undefined ? {} : { qs: expectedQuery }),
				},
			},
		]);
	});
}

test('execute returns empty data for an unsupported operation', async () => {
	const { context, requests } = createExecutionContext([{ resource: 'unknown', operation: 'unknown' }]);

	const result = await new Xquik().execute.call(context);

	assert.deepEqual(result, [[{ json: {}, pairedItem: { item: 0 } }]]);
	assert.deepEqual(requests, []);
});

test('execute preserves API errors when continue-on-fail is disabled', async () => {
	const requestError = apiError();
	const { context } = createExecutionContext([{ resource: 'account', operation: 'getCredits' }], { requestError });

	await assert.rejects(
		() => new Xquik().execute.call(context),
		(error: unknown) => error === requestError,
	);
});

test('execute returns an error item when continue-on-fail is enabled', async () => {
	const requestError = apiError();
	const { context } = createExecutionContext([{ resource: 'account', operation: 'getCredits' }], {
		continueOnFail: true,
		requestError,
	});

	const result = await new Xquik().execute.call(context);

	assert.deepEqual(result, [[{ json: { error: requestError.message }, pairedItem: { item: 0 } }]]);
});

test('execute reports a safe fallback for non-error failures', async () => {
	const { context } = createExecutionContext([{ resource: 'account', operation: 'getCredits' }], {
		continueOnFail: true,
		parameterError: 'Invalid parameter.',
	});

	const result = await new Xquik().execute.call(context);

	assert.deepEqual(result, [[{ json: { error: 'Request failed. Review the input and retry.' }, pairedItem: { item: 0 } }]]);
});

for (const [label, parameterError] of [
	['an error', new Error('Invalid parameter.')],
	['a thrown text', 'Invalid parameter.'],
] as const) {
	test(`execute wraps ${label} with item context`, async () => {
		const { context } = createExecutionContext([{ resource: 'account', operation: 'getCredits' }], {
			parameterError,
		});

		await assert.rejects(
			() => new Xquik().execute.call(context),
			(error: unknown) =>
				error instanceof NodeOperationError &&
				error.message === 'Invalid parameter.' &&
				error.context.itemIndex === 0,
		);
	});
}
