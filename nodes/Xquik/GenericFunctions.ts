// SPDX-FileCopyrightText: 2026 Xquik Contributors
// SPDX-License-Identifier: MIT

import type { IDataObject, IExecuteFunctions, IHttpRequestOptions, IHttpRequestMethods } from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';

const XQUIK_API_BASE_URL = 'https://xquik.com/api/v1';

export type XquikRequestContext = Pick<IExecuteFunctions, 'getNode'> & {
	readonly helpers: {
		readonly httpRequestWithAuthentication: (
			credentialsType: string,
			requestOptions: IHttpRequestOptions,
		) => Promise<unknown>;
	};
};

export function addOptionalParameter(parameters: IDataObject, name: string, value: IDataObject[string]): void {
	if (value !== undefined && value !== '') {
		parameters[name] = value;
	}
}

function isDataObject(value: unknown): value is IDataObject {
	return (
		typeof value === 'object' &&
		value !== null &&
		!Array.isArray(value) &&
		Object.values(value).every((entry: unknown) => typeof entry !== 'bigint' && typeof entry !== 'symbol')
	);
}

export async function xquikApiRequest(
	this: XquikRequestContext,
	method: IHttpRequestMethods,
	endpoint: string,
	query: IDataObject = {},
): Promise<IDataObject> {
	const options: IHttpRequestOptions = {
		headers: {
			Accept: 'application/json',
		},
		method,
		url: `${XQUIK_API_BASE_URL}${endpoint}`,
		json: true,
	};

	if (Object.values(query).some((value) => value !== undefined && value !== null && value !== '')) {
		options.qs = query;
	}

	const response: unknown = await this.helpers.httpRequestWithAuthentication.call(this, 'xquikApi', options);
	if (isDataObject(response)) {
		return response;
	}
	throw new NodeOperationError(this.getNode(), 'The Xquik API returned a response that is not a JSON object.');
}
