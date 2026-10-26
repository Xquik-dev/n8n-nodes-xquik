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

function toDataObject(value: unknown): IDataObject | undefined {
	if (typeof value !== 'object' || value === null || Array.isArray(value)) {
		return undefined;
	}
	const data: IDataObject = {};
	const fields: Readonly<Record<string, unknown>> = { ...value };
	for (const [key, entry] of Object.entries(fields)) {
		if (
			typeof entry !== 'string' &&
			typeof entry !== 'number' &&
			typeof entry !== 'boolean' &&
			typeof entry !== 'object' &&
			entry !== undefined
		) {
			return undefined;
		}
		data[key] = entry;
	}
	return data;
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

	const response = toDataObject(
		await this.helpers.httpRequestWithAuthentication.call(this, 'xquikApi', options),
	);
	if (response === undefined) {
		throw new NodeOperationError(this.getNode(), 'The Xquik API returned a response that is not a JSON object.');
	}
	return response;
}
