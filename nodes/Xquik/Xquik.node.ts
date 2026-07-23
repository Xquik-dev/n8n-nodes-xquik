// SPDX-FileCopyrightText: 2026 Xquik Contributors
// SPDX-License-Identifier: MIT

import type {
	IDataObject,
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
} from 'n8n-workflow';
import { NodeApiError, NodeConnectionTypes, NodeOperationError } from 'n8n-workflow';

import { addOptionalParameter, xquikApiRequest } from './GenericFunctions';

export class Xquik implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Xquik',
		name: 'xquik',
		icon: {
			light: 'file:xquik-light.svg',
			dark: 'file:xquik-dark.svg',
		},
		group: ['transform'],
		version: 1,
		subtitle: '={{$parameter["operation"] + ": " + $parameter["resource"]}}',
		description: 'Search X data and inspect Xquik account state. Not affiliated with X Corp.',
		defaults: {
			name: 'Xquik',
		},
		usableAsTool: true,
		inputs: [NodeConnectionTypes.Main],
		outputs: [NodeConnectionTypes.Main],
		credentials: [
			{
				name: 'xquikApi',
				required: true,
			},
		],
		properties: [
			{
				displayName: 'Resource',
				name: 'resource',
				type: 'options',
				noDataExpression: true,
				options: [
					{
						name: 'Account',
						value: 'account',
					},
					{
						name: 'Follow',
						value: 'follow',
					},
					{
						name: 'Trend',
						value: 'trend',
					},
					{
						name: 'Tweet',
						value: 'tweet',
					},
					{
						name: 'User',
						value: 'user',
					},
				],
				default: 'tweet',
			},
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: {
					show: {
						resource: ['account'],
					},
				},
				options: [
					{
						name: 'Get Credits',
						value: 'getCredits',
						description: 'Get the current credit balance',
						action: 'Get credit balance',
					},
				],
				default: 'getCredits',
			},
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: {
					show: {
						resource: ['follow'],
					},
				},
				options: [
					{
						name: 'Check',
						value: 'check',
						description: 'Check whether one user follows another',
						action: 'Check follow relationship',
					},
				],
				default: 'check',
			},
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: {
					show: {
						resource: ['trend'],
					},
				},
				options: [
					{
						name: 'Get Many',
						value: 'getAll',
						description: 'Get trending topics by region',
						action: 'Get many trends',
					},
				],
				default: 'getAll',
			},
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: {
					show: {
						resource: ['tweet'],
					},
				},
				options: [
					{
						name: 'Search',
						value: 'search',
						description: 'Search tweets by query',
						action: 'Search tweets',
					},
				],
				default: 'search',
			},
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: {
					show: {
						resource: ['user'],
					},
				},
				options: [
					{
						name: 'Search',
						value: 'search',
						description: 'Search users by name or username',
						action: 'Search users',
					},
				],
				default: 'search',
			},
			{
				displayName: 'Query',
				name: 'query',
				type: 'string',
				required: true,
				default: '',
				displayOptions: {
					show: {
						resource: ['tweet', 'user'],
						operation: ['search'],
					},
				},
				description: 'Search query',
			},
			{
				displayName: 'Query Type',
				name: 'queryType',
				type: 'options',
				displayOptions: {
					show: {
						resource: ['tweet'],
						operation: ['search'],
					},
				},
				options: [
					{
						name: 'Latest',
						value: 'Latest',
					},
					{
						name: 'Top',
						value: 'Top',
					},
				],
				default: 'Latest',
				description: 'Sort order for tweet search results',
			},
			{
				displayName: 'Limit',
				name: 'limit',
				type: 'number',
				typeOptions: {
					minValue: 1,
					maxValue: 200,
				},
				displayOptions: {
					show: {
						resource: ['tweet'],
						operation: ['search'],
					},
				},
				default: 50,
				description: 'Max number of results to return',
			},
			{
				displayName: 'Cursor',
				name: 'cursor',
				type: 'string',
				displayOptions: {
					show: {
						resource: ['tweet', 'user'],
						operation: ['search'],
					},
				},
				default: '',
				description: 'Pagination cursor from the previous response',
			},
			{
				displayName: 'Additional Fields',
				name: 'additionalFields',
				type: 'collection',
				placeholder: 'Add Field',
				default: {},
				displayOptions: {
					show: {
						resource: ['tweet'],
						operation: ['search'],
					},
				},
				options: [
					{
						displayName: 'From User',
						name: 'fromUser',
						type: 'string',
						default: '',
						description: 'Only include tweets from this username, without @',
					},
					{
						displayName: 'Language',
						name: 'lang',
						type: 'string',
						default: '',
						description: 'Language code filter',
					},
					{
						displayName: 'Since Time',
						name: 'sinceTime',
						type: 'dateTime',
						default: '',
						description: 'Only include tweets after this timestamp',
					},
					{
						displayName: 'Until Time',
						name: 'untilTime',
						type: 'dateTime',
						default: '',
						description: 'Only include tweets before this timestamp',
					},
					{
						displayName: 'Verified Only',
						name: 'verifiedOnly',
						type: 'boolean',
						default: false,
						description: 'Whether to only include tweets from verified users',
					},
				],
			},
			{
				displayName: 'Source Username',
				name: 'source',
				type: 'string',
				required: true,
				default: '',
				displayOptions: {
					show: {
						resource: ['follow'],
						operation: ['check'],
					},
				},
				description: 'Username to check, without @',
			},
			{
				displayName: 'Target Username',
				name: 'target',
				type: 'string',
				required: true,
				default: '',
				displayOptions: {
					show: {
						resource: ['follow'],
						operation: ['check'],
					},
				},
				description: 'Target username, without @',
			},
			{
				displayName: 'WOEID',
				name: 'woeid',
				type: 'number',
				typeOptions: {
					minValue: 1,
				},
				displayOptions: {
					show: {
						resource: ['trend'],
						operation: ['getAll'],
					},
				},
				default: 1,
				description: 'Region WOEID code. 1 is worldwide.',
			},
			{
				displayName: 'Count',
				name: 'count',
				type: 'number',
				typeOptions: {
					minValue: 1,
					maxValue: 50,
				},
				displayOptions: {
					show: {
						resource: ['trend'],
						operation: ['getAll'],
					},
				},
				default: 30,
				description: 'Number of trending topics to return',
			},
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];

		for (let i = 0; i < items.length; i++) {
			try {
				const responseData = await executeItem.call(this, i);

				returnData.push({
					json: responseData,
					pairedItem: {
						item: i,
					},
				});
			} catch (error) {
				if (this.continueOnFail()) {
					returnData.push({
						json: {
							error: error instanceof Error ? error.message : 'Unknown error',
						},
						pairedItem: {
							item: i,
						},
					});
					continue;
				}

				rethrowExecutionError.call(this, error, i);
			}
		}

		return [returnData];
	}
}

function rethrowExecutionError(this: IExecuteFunctions, error: unknown, itemIndex: number): never {
	if (error instanceof NodeApiError || error instanceof NodeOperationError) {
		throw error;
	}

	throw new NodeOperationError(this.getNode(), error as Error, { itemIndex });
}

async function executeItem(this: IExecuteFunctions, itemIndex: number): Promise<IDataObject> {
	const resource = this.getNodeParameter('resource', itemIndex) as string;
	const operation = this.getNodeParameter('operation', itemIndex) as string;

	if (resource === 'account' && operation === 'getCredits') {
		return await xquikApiRequest.call(this, 'GET', '/credits');
	}

	if (resource === 'tweet' && operation === 'search') {
		const query: IDataObject = {
			q: this.getNodeParameter('query', itemIndex),
			queryType: this.getNodeParameter('queryType', itemIndex),
			limit: this.getNodeParameter('limit', itemIndex),
		};
		const cursor = this.getNodeParameter('cursor', itemIndex) as string;
		const additionalFields = this.getNodeParameter('additionalFields', itemIndex) as IDataObject;

		addOptionalParameter(query, 'cursor', cursor);
		addOptionalParameter(query, 'fromUser', additionalFields.fromUser as string | undefined);
		addOptionalParameter(query, 'language', additionalFields.lang as string | undefined);
		addOptionalParameter(query, 'sinceTime', additionalFields.sinceTime as string | undefined);
		addOptionalParameter(query, 'untilTime', additionalFields.untilTime as string | undefined);
		addOptionalParameter(
			query,
			'verifiedOnly',
			additionalFields.verifiedOnly as boolean | undefined,
		);

		return await xquikApiRequest.call(this, 'GET', '/x/tweets/search', query);
	}

	if (resource === 'user' && operation === 'search') {
		const query: IDataObject = {
			q: this.getNodeParameter('query', itemIndex),
		};
		const cursor = this.getNodeParameter('cursor', itemIndex) as string;

		addOptionalParameter(query, 'cursor', cursor);

		return await xquikApiRequest.call(this, 'GET', '/x/users/search', query);
	}

	if (resource === 'trend' && operation === 'getAll') {
		return await xquikApiRequest.call(this, 'GET', '/trends', {
			woeid: this.getNodeParameter('woeid', itemIndex),
			count: this.getNodeParameter('count', itemIndex),
		});
	}

	if (resource === 'follow' && operation === 'check') {
		return await xquikApiRequest.call(this, 'GET', '/x/followers/check', {
			source: this.getNodeParameter('source', itemIndex),
			target: this.getNodeParameter('target', itemIndex),
		});
	}

	return {};
}
