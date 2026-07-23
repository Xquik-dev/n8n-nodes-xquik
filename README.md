# Xquik n8n Nodes: Tweet Search, Users, Trends & Follow Checks

[![OpenSSF Best Practices](https://www.bestpractices.dev/projects/13726/badge)](https://www.bestpractices.dev/projects/13726)

Build n8n workflows that search tweets, find users, read trends, and check follow relationships.

Use this package for bounded, read-only X data steps.

## Choose an Operation

| Customer question | n8n operation | Xquik route |
| --- | --- | --- |
| How do I search tweets in n8n? | Tweet: search | `GET /x/tweets/search` |
| How do I search X or Twitter users? | User: search | `GET /x/users/search` |
| How do I read regional X trends? | Trend: get | `GET /x/trends` |
| Does one account follow another? | Follow: check | `GET /x/followers/check` |
| How do I check available credits? | Account: get credits | `GET /credits` |

Need full follower exports or posting automation? Use the
[Xquik API](https://docs.xquik.com/api-reference/overview) instead.

## Install

Install `n8n-nodes-xquik` from **Settings → Community Nodes**.

```sh
npm install n8n-nodes-xquik
```

## Credentials

Create an Xquik API key, then add it to the Xquik API credential in n8n. The node sends the key in the `x-api-key` header.

## Development and Testing

```sh
npm ci --ignore-scripts
npm test
npm run lint
npm audit --omit=dev
npm audit --audit-level=high
npm audit signatures
npm run check:reproducible
npm pack --dry-run
```

Tests validate request paths, parameters, credentials, and errors.
`npm test` enforces 100% line, branch, and function coverage.
CI also verifies REUSE 3.3 license metadata.
CI builds twice and compares every package byte.

## Resources

- [n8n Community Nodes](https://docs.n8n.io/integrations/community-nodes/)
- [Xquik API Authentication](https://docs.xquik.com/api-reference/authentication)
- [Xquik API Overview](https://docs.xquik.com/api-reference/overview)

Xquik is an independent third-party service. Not affiliated with X Corp. "Twitter" and "X" are trademarks of X Corp.
