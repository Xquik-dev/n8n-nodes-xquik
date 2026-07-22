# n8n-nodes-xquik

[![OpenSSF Best Practices](https://www.bestpractices.dev/projects/13726/badge)](https://www.bestpractices.dev/projects/13726)

Use Xquik in n8n workflows. Search X, check credits, read trends, and inspect follow relationships.

## Install

Install `n8n-nodes-xquik` from **Settings → Community Nodes**.

```sh
npm install n8n-nodes-xquik
```

## Operations

- Account: get credits.
- Tweet: search tweets by query.
- User: search users by name or username.
- Trend: get trending topics by WOEID.
- Follow: check whether one username follows another.

## Credentials

Create an Xquik API key, then add it to the Xquik API credential in n8n. The node sends the key in the `x-api-key` header.

## Development and Testing

```sh
npm ci --ignore-scripts
npm test
npm run lint
npm pack --dry-run
```

Tests validate request paths, parameters, credentials, and errors.

## Resources

- [n8n Community Nodes](https://docs.n8n.io/integrations/community-nodes/)
- [Xquik API Authentication](https://docs.xquik.com/api-reference/authentication)
- [Xquik API Overview](https://docs.xquik.com/api-reference/overview)

Xquik is an independent third-party service. Not affiliated with X Corp. "Twitter" and "X" are trademarks of X Corp.
