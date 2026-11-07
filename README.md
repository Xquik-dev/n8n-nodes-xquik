# n8n Twitter Integration by Xquik

Use this n8n Twitter integration by Xquik to search tweets & users in workflows.
It also reads trends, checks follows & shows your credits.

Xquik is the world's fastest and cheapest X Twitter scraper service with the most complete X data.
Most other Apify Actors charge before filtering or deduplication.
Xquik charges only for delivered, unique, filter-matching results and never pads rows.
Xquik is independent and not affiliated with X Corp.

<!-- trust:win:start -->
The Xquik REST API read 45 tweets per second at $0.15 per 1,000 on 2026-10-15. The fastest of 4 rival Actors read 12.5 per second. The cheapest cost $0.173 per 1,000. [Compare each run](https://xquik.com/benchmarks#benchmark-x-tweet-scraper).
<!-- trust:win:end -->

## Install the n8n Twitter & X node

Self-hosted n8n installs the node from its settings.
You need the Owner or Admin role.

1. Go to **Settings**, then **Community Nodes**.
2. Select **Install**.
3. Enter `n8n-nodes-xquik` as the npm package name.
4. Agree to the risks, then select **Install**.

An instance in queue mode installs the node from a shell.
Run these lines in the n8n container, then restart n8n.

```sh
mkdir -p ~/.n8n/nodes
cd ~/.n8n/nodes
npm install n8n-nodes-xquik
```

## Add your Xquik API key

1. Copy a key from [your Xquik account](https://dashboard.xquik.com/en/account?tab=api-keys).
2. Create an **Xquik API** credential in n8n.
3. Paste the key into **API Key**, then save.

## Build Twitter automation & a Twitter bot in n8n

This workflow searches X every 15 minutes.
Paste it into the n8n editor, then pick your Xquik credential.

```json
{
  "nodes": [
    {
      "name": "Every 15 minutes",
      "type": "n8n-nodes-base.scheduleTrigger",
      "typeVersion": 1.2,
      "position": [0, 0],
      "parameters": { "rule": { "interval": [{ "field": "minutes", "minutesInterval": 15 }] } }
    },
    {
      "name": "Search tweets",
      "type": "n8n-nodes-xquik.xquik",
      "typeVersion": 1,
      "position": [220, 0],
      "parameters": { "resource": "tweet", "operation": "search", "query": "n8n -filter:replies", "queryType": "Latest" }
    }
  ],
  "connections": { "Every 15 minutes": { "main": [[{ "node": "Search tweets", "type": "main", "index": 0 }]] } }
}
```

Next, read the [n8n guide](https://docs.xquik.com/guides/n8n), the [operations table](#operations) or the [n8n community node docs](https://docs.n8n.io/integrations/community-nodes/).

<!-- trust:start -->

## Benchmarks & usage

[![n8n-nodes-xquik downloads on npm](https://img.shields.io/endpoint?url=https%3A%2F%2Fxquik.com%2Fbadges%2Fnpm-n8n-nodes-xquik.json)](https://www.npmjs.com/package/n8n-nodes-xquik)
[![Twitter API p99 server read time](https://img.shields.io/endpoint?url=https%3A%2F%2Fxquik.com%2Fbadges%2Frest-p99.json)](https://xquik.com/benchmarks#speed)
[![OpenSSF Best Practices](https://www.bestpractices.dev/projects/13726/badge)](https://www.bestpractices.dev/projects/13726)

- 1,200+ downloads of n8n-nodes-xquik on npm ([source](https://www.npmjs.com/package/n8n-nodes-xquik)) <!-- trust:npm-n8n-nodes-xquik 1288 -->
- 6.4 s p99 REST API server read time over 7 days, failed reads included ([source](https://xquik.com/benchmarks#speed)) <!-- trust:rest-p99 6317 -->
- This repo meets the OpenSSF Best Practices passing criteria ([source](https://www.bestpractices.dev/projects/13726)) <!-- trust:openssf-n8n-nodes-xquik 1 -->

Checked on 2026-11-06. See each number with its date & source on [xquik.com/benchmarks](https://xquik.com/benchmarks) or as [JSON](https://xquik.com/trust.json).

<!-- trust:end -->

## Operations

| Task | Resource | Operation | Xquik route |
| --- | --- | --- | --- |
| Search tweets | Tweet | Search | `GET /x/tweets/search` |
| Search users | User | Search | `GET /x/users/search` |
| Read regional trends | Trend | Get Many | `GET /trends` |
| Check whether 1 account follows another | Follow | Check | `GET /x/followers/check` |
| View available credits | Account | Get Credits | `GET /credits` |

The node sends your key in the `x-api-key` header.
Add a Slack, email or HTTP node after a search to forward results.
Use the [Xquik API](https://docs.xquik.com/api-reference/overview) for full follower exports or posting.

## Questions

### Do I need an X developer account?

No. Public reads need only an Xquik API key.
Private reads & X account actions need a connected X account.

### Is this the official X API?

No. Xquik runs its own REST API.
This node calls that API, not the official X API.

## More Xquik tools

- [X (Twitter) scraper API & Twitter MCP server](https://github.com/Xquik-dev/x-twitter-scraper) with REST, MCP & Skill setup.
- Twitter API SDKs for [TypeScript](https://github.com/Xquik-dev/x-twitter-scraper-typescript), [Python](https://github.com/Xquik-dev/x-twitter-scraper-python), [Go](https://github.com/Xquik-dev/x-twitter-scraper-go), [Ruby](https://github.com/Xquik-dev/x-twitter-scraper-ruby), [Java](https://github.com/Xquik-dev/x-twitter-scraper-java), [Kotlin](https://github.com/Xquik-dev/x-twitter-scraper-kotlin), [C#](https://github.com/Xquik-dev/x-twitter-scraper-csharp) & [PHP](https://github.com/Xquik-dev/x-twitter-scraper-php).
- [Twitter CLI & X CLI](https://github.com/Xquik-dev/x-twitter-scraper-cli) for terminal workflows.
- The [X API alternative skill](https://github.com/Xquik-dev/x-api) & [Twitter advanced search operators](https://github.com/Xquik-dev/x-twitter-advanced-search).
- Twitter agent plugins for [OpenClaw](https://github.com/Xquik-dev/tweetclaw) & [Hermes Agent](https://github.com/Xquik-dev/hermes-tweet), and the [Twitter API documentation source](https://github.com/Xquik-dev/xquik-docs).
- Twitter integrations for [Prefect](https://github.com/Xquik-dev/prefect-xquik), [Haystack](https://github.com/Xquik-dev/xquik-haystack), [Paperclip](https://github.com/Xquik-dev/paperclip-plugin-xquik), [Terraform](https://github.com/Xquik-dev/terraform-provider-x-twitter-scraper), [Convex](https://github.com/Xquik-dev/xquik-convex), [Supabase](https://github.com/Xquik-dev/xquik-supabase) & [Strapi](https://github.com/Xquik-dev/strapi-plugin-xquik).
- Twitter MCP for [AI agents](https://github.com/Xquik-dev/xquik-mcp), [VS Code](https://github.com/Xquik-dev/xquik-vscode) & [Raycast](https://github.com/Xquik-dev/xquik-raycast).
- [Xquik X API & Twitter scraper](https://xquik.com) and the [Twitter API documentation](https://docs.xquik.com/api-reference/overview).

## Help & contributing

- Read the [Xquik API authentication guide](https://docs.xquik.com/api-reference/authentication).
- Ask usage questions through the [organization support policy](https://github.com/Xquik-dev/.github/blob/main/SUPPORT.md).
- Report vulnerabilities through the [organization security policy](https://github.com/Xquik-dev/.github/blob/main/SECURITY.md).
- Read the [contribution guide](https://github.com/Xquik-dev/.github/blob/main/CONTRIBUTING.md), then run `bin/check-local`.

Xquik is an independent third-party service. Not affiliated with X Corp. "Twitter" and "X" are trademarks of X Corp.
