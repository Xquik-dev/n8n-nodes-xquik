import type {
	IAuthenticateGeneric,
	Icon,
	ICredentialTestRequest,
	ICredentialType,
	INodeProperties,
} from 'n8n-workflow';

export class XquikApi implements ICredentialType {
	name = 'xquikApi';

	displayName = 'Xquik API';

	icon: Icon = {
		light: 'file:../icons/xquik-light.svg',
		dark: 'file:../icons/xquik-dark.svg',
	};

	documentationUrl = 'https://docs.xquik.com/api-reference/authentication';

	properties: INodeProperties[] = [
		{
			displayName: 'API Key',
			name: 'apiKey',
			type: 'string',
			typeOptions: { password: true },
			required: true,
			default: '',
		},
	];

	authenticate: IAuthenticateGeneric = {
		type: 'generic',
		properties: {
			headers: {
				'x-api-key': '={{ $credentials.apiKey }}',
			},
		},
	};

	test: ICredentialTestRequest = {
		request: {
			method: 'GET',
			url: 'https://xquik.com/api/v1/credits',
		},
	};
}
