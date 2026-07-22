# n8n-nodes-xquik

> **Xquik is an independent third-party service.** Not affiliated with X Corp.
> "Twitter" and "X" are trademarks of X Corp.

This is an n8n community node for Xquik. It lets you search X data, inspect account credits, fetch trends, and check follow relationships in n8n workflows.

[n8n](https://n8n.io/) is a fair-code licensed workflow automation platform.

## Status

Install `n8n-nodes-xquik` from **Settings → Community Nodes** in n8n.

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

## Compatibility

This package follows the current n8n community-node package format from `n8n-io/n8n-nodes-starter`.

## Development And Testing

```sh
npm ci --ignore-scripts
npm test
npm run lint
npm pack --dry-run
```

The test suite varies request inputs and validates generated request options.
CI runs it on every pull request and every push to `main`. Bug fixes must
include a regression test. New behavior must include tests for expected and
invalid inputs.

## Resources

- [n8n Community Nodes](https://docs.n8n.io/integrations/community-nodes/)
- [Xquik API Authentication](https://docs.xquik.com/api-reference/authentication)
- [Xquik API Overview](https://docs.xquik.com/api-reference/overview)
