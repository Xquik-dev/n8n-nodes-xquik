# Xquik n8n Twitter Node

[![OpenSSF Best Practices](https://www.bestpractices.dev/projects/13726/badge)](https://www.bestpractices.dev/projects/13726)

Add read-only Twitter data to n8n: search tweets and users, read trends, check follows, and view Xquik credits.

## Operations

| Task | n8n operation | Xquik route |
| --- | --- | --- |
| Search tweets | Tweet: search | `GET /x/tweets/search` |
| Search users | User: search | `GET /x/users/search` |
| Read regional trends | Trend: get | `GET /x/trends` |
| Check whether one account follows another | Follow: check | `GET /x/followers/check` |
| View available credits | Account: get credits | `GET /credits` |

Use the [Xquik API](https://docs.xquik.com/api-reference/overview) for full follower exports or approved posting.

## Install

Install `n8n-nodes-xquik` from **Settings → Community Nodes**.

```sh
npm install n8n-nodes-xquik
```

## Credentials

Create an Xquik API key and add it to the Xquik API credential in n8n. The node sends it in the `x-api-key` header.

## Verify changes

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

Tests enforce 100% coverage. CI checks request contracts, REUSE 3.3 metadata, and reproducible package bytes.

## Resources

- [n8n community nodes](https://docs.n8n.io/integrations/community-nodes/)
- [Xquik API authentication](https://docs.xquik.com/api-reference/authentication)
- [Xquik API overview](https://docs.xquik.com/api-reference/overview)
- [Organization support policy](https://github.com/Xquik-dev/.github/blob/main/SUPPORT.md)
- [Organization security policy](https://github.com/Xquik-dev/.github/blob/main/SECURITY.md)
- [Contribution guide](https://github.com/Xquik-dev/.github/blob/main/CONTRIBUTING.md)

Xquik is an independent third-party service. Not affiliated with X Corp. "Twitter" and "X" are trademarks of X Corp.
