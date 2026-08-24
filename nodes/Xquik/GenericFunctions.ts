// SPDX-FileCopyrightText: 2026 Xquik Contributors
// SPDX-License-Identifier: MIT

import type {
	IDataObject,
	IExecuteFunctions,
	IHttpRequestOptions,
	IHttpRequestMethods,
	JsonObject,
} from 'n8n-workflow';
import { NodeApiError } from 'n8n-workflow';

const XQUIK_API_BASE_URL = 'https://xquik.com/api/v1';

export function addOptionalParameter(
	parameters: IDataObject,
	name: string,
	value: string | number | boolean | undefined,
): void {
	if (value !== undefined && value !== '') {
		parameters[name] = value;
	}
}

export async function xquikApiRequest(
	this: IExecuteFunctions,
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

	try {
		return (await this.helpers.httpRequestWithAuthentication.call(
			this,
			'xquikApi',
			options,
		)) as IDataObject;
	} catch (error) {
		throw new NodeApiError(this.getNode(), error as JsonObject);
	}
}
