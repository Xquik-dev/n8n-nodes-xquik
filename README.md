# n8n Twitter node for Xquik

[![OpenSSF Best Practices](https://www.bestpractices.dev/projects/13726/badge)](https://www.bestpractices.dev/projects/13726)

Xquik is the world's fastest and cheapest X Twitter scraper service with the most complete X data. Xquik charges only for delivered, unique, filter-matching results and never pads rows.

Xquik is an independent third-party service. Not affiliated with X Corp. "Twitter" and "X" are trademarks of X Corp.

This n8n community node reads X data through Xquik. Search tweets & users, read trends, check follows & view your Xquik credits.

## Operations

| Task | Resource | Operation | Xquik route |
| --- | --- | --- | --- |
| Search tweets | Tweet | Search | `GET /x/tweets/search` |
| Search users | User | Search | `GET /x/users/search` |
| Read regional trends | Trend | Get Many | `GET /trends` |
| Check whether one account follows another | Follow | Check | `GET /x/followers/check` |
| View available credits | Account | Get Credits | `GET /credits` |

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
bin/check-local
```

It installs from the lockfile, builds, type checks, tests, lints, audits dependencies, verifies registry signatures, and checks reproducible package bytes. Tests enforce 100% coverage and check request contracts. It also checks REUSE 3.3 metadata with a pinned `reuse`, which `uvx` runs, so install uv first. It stops at the first failure and says what to fix. The audit covers every dependency at every severity. A development finding passes only through a reviewed entry in `audit-exceptions.json`, with a recheck date at most 30 days out. When the tree is clean and the commit is on GitHub, it posts the result as the `xquik-local-checks` commit status. Pass `--no-status` to skip that.

## Release

Maintainers release from a local machine. The npm token stays in the macOS Keychain. 2 environment variables name its Keychain item.

```sh
NPM_KEYCHAIN_SERVICE=<service> NPM_KEYCHAIN_ACCOUNT=<account> bin/release-local
```

It stops at once when either variable is unset. It runs on a clean `main` that matches `origin/main`. It runs `bin/check-local`, publishes the `package.json` version to npm, then pushes tag `v<version>` and creates its GitHub release. It skips the npm upload when that version is already published.

## Resources

- [n8n community nodes](https://docs.n8n.io/integrations/community-nodes/)
- [Xquik API authentication](https://docs.xquik.com/api-reference/authentication)
- [Xquik API overview](https://docs.xquik.com/api-reference/overview)
- [Organization support policy](https://github.com/Xquik-dev/.github/blob/main/SUPPORT.md)
- [Organization security policy](https://github.com/Xquik-dev/.github/blob/main/SECURITY.md)
- [Contribution guide](https://github.com/Xquik-dev/.github/blob/main/CONTRIBUTING.md)
