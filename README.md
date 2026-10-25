# n8n Twitter community node for Xquik

[![OpenSSF Best Practices](https://www.bestpractices.dev/projects/13726/badge)](https://www.bestpractices.dev/projects/13726)

Xquik is the world's fastest and cheapest X Twitter scraper service with the most complete X data. Xquik charges only for delivered, unique, filter-matching results and never pads rows.

Xquik is an independent third-party service. Not affiliated with X Corp. "Twitter" and "X" are trademarks of X Corp.

This n8n community node reads X data through Xquik. Search tweets & users, read trends, check follows & view your Xquik credits.

<!-- trust:start -->

## Trust & usage

[![Twitter API package downloads](https://img.shields.io/endpoint?url=https%3A%2F%2Fxquik.com%2Fbadges%2Fdownloads.json)](https://xquik.com/trust#downloads)
[![Twitter scraper users on Apify](https://img.shields.io/endpoint?url=https%3A%2F%2Fxquik.com%2Fbadges%2Fapify-users.json)](https://apify.com/xquik)
[![Twitter scraper runs on Apify](https://img.shields.io/endpoint?url=https%3A%2F%2Fxquik.com%2Fbadges%2Fapify-runs.json)](https://apify.com/xquik)
[![Tweet scraper rating on Apify](https://img.shields.io/endpoint?url=https%3A%2F%2Fxquik.com%2Fbadges%2Fapify-rating.json)](https://apify.com/xquik/x-tweet-scraper/reviews)
[![Xquik Twitter API accounts](https://img.shields.io/endpoint?url=https%3A%2F%2Fxquik.com%2Fbadges%2Faccounts.json)](https://xquik.com/trust#accounts)
[![Twitter Skill installs](https://img.shields.io/endpoint?url=https%3A%2F%2Fxquik.com%2Fbadges%2Fskill-installs.json)](https://xquik.com/trust#skill-installs)
[![Xquik verified revenue on TrustMRR](https://img.shields.io/endpoint?url=https%3A%2F%2Fxquik.com%2Fbadges%2Frevenue.json)](https://trustmrr.com/startup/xquik)
[![Twitter API p99 server read time](https://img.shields.io/endpoint?url=https%3A%2F%2Fxquik.com%2Fbadges%2Frest-p99.json)](https://xquik.com/trust#speed)
[![Xquik GitHub stars](https://img.shields.io/endpoint?url=https%3A%2F%2Fxquik.com%2Fbadges%2Fgithub-stars.json)](https://github.com/Xquik-dev)
[![n8n-nodes-xquik downloads on npm](https://img.shields.io/endpoint?url=https%3A%2F%2Fxquik.com%2Fbadges%2Fnpm-n8n-nodes-xquik.json)](https://www.npmjs.com/package/n8n-nodes-xquik)
[![OpenSSF Best Practices](https://www.bestpractices.dev/projects/13726/badge)](https://www.bestpractices.dev/projects/13726)

- 53,000+ downloads of Xquik's Twitter API packages on npm, PyPI, RubyGems, NuGet, Packagist & Terraform ([source](https://xquik.com/trust#downloads)) <!-- trust:downloads 53547 -->
- 9,500+ users of Xquik's Twitter scraper Actors on Apify ([source](https://apify.com/xquik)) <!-- trust:apify-users 9595 -->
- 6,700,000+ runs of Xquik's Twitter scraper Actors on Apify ([source](https://apify.com/xquik)) <!-- trust:apify-runs 6765249 -->
- 4.66 of 5 for the X Tweet Scraper from 16 Apify reviews ([source](https://apify.com/xquik/x-tweet-scraper/reviews)) <!-- trust:apify-rating 4.66 16 -->
- 4,000+ accounts on xquik.com ([source](https://xquik.com/trust#accounts)) <!-- trust:accounts 4073 -->
- 1,600+ installs of Xquik's Twitter Skills on skills.sh ([source](https://xquik.com/trust#skill-installs)) <!-- trust:skill-installs 1617 -->
- $39,000+ in revenue verified by TrustMRR ([source](https://trustmrr.com/startup/xquik)) <!-- trust:revenue 39784 -->
- 13.2 s p99 REST API server read time over 7 days, failed reads included ([source](https://xquik.com/trust#speed)) <!-- trust:rest-p99 13194 -->
- 380+ GitHub stars across Xquik's repos ([source](https://github.com/Xquik-dev)) <!-- trust:github-stars 383 -->
- 970+ downloads of n8n-nodes-xquik on npm ([source](https://www.npmjs.com/package/n8n-nodes-xquik)) <!-- trust:npm-n8n-nodes-xquik 978 -->
- This repo meets the OpenSSF Best Practices passing criteria ([source](https://www.bestpractices.dev/projects/13726)) <!-- trust:openssf-n8n-nodes-xquik 1 -->

Checked on 2026-10-25. See each number with its date & source on [xquik.com/trust](https://xquik.com/trust) or as [JSON](https://xquik.com/trust.json).

<!-- trust:end -->

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

It installs from the lockfile, builds, type checks, tests, lints, audits dependencies, verifies registry signatures, and checks reproducible package bytes. Tests enforce 100% coverage and check request contracts. It also checks REUSE 3.3 metadata with a pinned `reuse`, which `uvx` runs, so install uv first. Last, it runs CodeQL's security-extended queries and fails on any result, so install CodeQL with `brew install --cask codeql`. It stops at the first failure and says what to fix. The audit covers every dependency at every severity. A development finding passes only through a reviewed entry in `audit-exceptions.json`, with a recheck date at most 30 days out. When the tree is clean and the commit is on GitHub, it posts the result as the `xquik-local-checks` commit status. Pass `--no-status` to skip that.

## Release

Maintainers release from a local machine. The npm token stays in the macOS Keychain. 2 environment variables name its Keychain item.

```sh
NPM_KEYCHAIN_SERVICE=<service> NPM_KEYCHAIN_ACCOUNT=<account> bin/release-local
```

It stops at once when either variable is unset. It runs on a clean `main` that matches `origin/main`. It runs `bin/check-local`, publishes the `package.json` version to npm, and checks that npm serves the same package it built. Only then it pushes tag `v<version>` and creates its GitHub release. It skips the npm upload when that version is already published.

`bin/release-local --dry-run` runs every check and `npm publish --dry-run`. It reads no token and publishes, tags and releases nothing.

## More Xquik tools

- [X (Twitter) scraper API & Twitter MCP server](https://github.com/Xquik-dev/x-twitter-scraper) with REST, MCP & Skill setup.
- Twitter API SDKs for [TypeScript](https://github.com/Xquik-dev/x-twitter-scraper-typescript), [Python](https://github.com/Xquik-dev/x-twitter-scraper-python), [Go](https://github.com/Xquik-dev/x-twitter-scraper-go), [Ruby](https://github.com/Xquik-dev/x-twitter-scraper-ruby), [Java](https://github.com/Xquik-dev/x-twitter-scraper-java), [Kotlin](https://github.com/Xquik-dev/x-twitter-scraper-kotlin), [C#](https://github.com/Xquik-dev/x-twitter-scraper-csharp) & [PHP](https://github.com/Xquik-dev/x-twitter-scraper-php).
- [Twitter CLI & X CLI](https://github.com/Xquik-dev/x-twitter-scraper-cli) for terminal workflows.
- [Twitter advanced search operators](https://github.com/Xquik-dev/x-twitter-advanced-search) with tested examples.
- [Xquik X API & Twitter scraper](https://xquik.com) and the [Twitter API documentation](https://docs.xquik.com/api-reference/overview).

## Resources

- [n8n community nodes](https://docs.n8n.io/integrations/community-nodes/)
- [Xquik API authentication](https://docs.xquik.com/api-reference/authentication)
- [Xquik API overview](https://docs.xquik.com/api-reference/overview)
- [Organization support policy](https://github.com/Xquik-dev/.github/blob/main/SUPPORT.md)
- [Organization security policy](https://github.com/Xquik-dev/.github/blob/main/SECURITY.md)
- [Contribution guide](https://github.com/Xquik-dev/.github/blob/main/CONTRIBUTING.md)
