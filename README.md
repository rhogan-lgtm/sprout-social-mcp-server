# Sprout Social MCP Server

An MCP (Model Context Protocol) server that connects Claude to the Sprout Social API for managing social media posts, profiles, and analytics.

## Features

**Core Workflow**
- `get_customer_id` — Get your Sprout Social customer ID
- `list_profiles` — List all connected social profiles (LinkedIn, X/Twitter, Instagram, Facebook, etc.)
- `create_post` — Create draft posts with optional scheduling, media, and tags
- `get_post` — Get details and status of a specific post

**Media & Metadata**
- `upload_media` — Upload images/videos via public URL
- `list_tags` — List available tags for organizing posts
- `list_users` — List all users on the account

**Analytics**
- `get_profile_analytics` — Aggregated analytics for social profiles over a date range
- `get_post_analytics` — Per-post performance metrics over a date range

## Prerequisites

- A Sprout Social API token ([developer docs](https://developers.sproutsocial.com/))
- Claude Desktop or Claude Code
- For npx: Node.js 18+ (recommended for most users)
- For uvx: Python 3.10+
- For clone method: Python 3.10+ and git

## Installation

Choose one of the following installation methods:

### Option 1: npx (Recommended)

No installation required! Just add this to your Claude Desktop config (`~/Library/Application Support/Claude/claude_desktop_config.json` on macOS):

```json
{
  "mcpServers": {
    "sprout-social": {
      "command": "npx",
      "args": ["-y", "sprout-social-mcp"],
      "env": {
        "SPROUT_API_TOKEN": "your_sprout_social_api_token_here",
        "SPROUT_CUSTOMER_ID": "your_customer_id_here"
      }
    }
  }
}
```

For Claude Code:

```bash
claude mcp add sprout-social -- npx -y sprout-social-mcp
```

Then set the environment variables in your shell or MCP config.

> Don't know your customer ID? You can use the `get_customer_id` tool after connecting to find it.

### Option 2: uvx / PyPI

No installation required! Add this to your Claude Desktop config:

```json
{
  "mcpServers": {
    "sprout-social": {
      "command": "uvx",
      "args": ["sprout-social-mcp"],
      "env": {
        "SPROUT_API_TOKEN": "your_sprout_social_api_token_here",
        "SPROUT_CUSTOMER_ID": "your_customer_id_here"
      }
    }
  }
}
```

For Claude Code:

```bash
claude mcp add sprout-social -- uvx sprout-social-mcp
```

Then set the environment variables in your shell or MCP config.

### Option 3: Clone & Install

For development or local customization:

1. Clone and install:

```bash
git clone https://github.com/kodowjam/sprout-social-mcp-server.git
cd sprout-social-mcp-server
pip install .
```

2. Configure environment:

```bash
cp .env.example .env
```

Edit `.env` with your credentials:

```
SPROUT_API_TOKEN=your_sprout_social_api_token_here
SPROUT_CUSTOMER_ID=your_customer_id_here
```

3. Connect to Claude Desktop:

```json
{
  "mcpServers": {
    "sprout-social": {
      "command": "python",
      "args": ["server.py"],
      "cwd": "/absolute/path/to/sprout-social-mcp-server"
    }
  }
}
```

For Claude Code:

```bash
claude mcp add sprout-social -- python /absolute/path/to/sprout-social-mcp-server/server.py
```

Restart Claude Desktop to load the server.

## Tools Reference

| Tool | Description | Key Parameters |
|------|-------------|----------------|
| `get_customer_id` | Get your Sprout customer ID | — |
| `list_profiles` | List connected social profiles with IDs, networks, and group IDs | — |
| `create_post` | Create a draft post, optionally scheduled | `profile_ids`, `text`, `scheduled_at`, `media_ids`, `tag_ids` |
| `get_post` | Get post details by ID | `post_id` |
| `upload_media` | Upload media from a public URL (expires 24hr unless attached to a post) | `url` |
| `list_tags` | List available tags for organizing posts | — |
| `list_users` | List all account users | — |
| `get_profile_analytics` | Aggregated profile metrics over a date range | `profile_ids`, `start_date`, `end_date`, `metrics` |
| `get_post_analytics` | Per-post metrics over a date range | `profile_ids`, `start_date`, `end_date`, `metrics` |

## Getting Your API Token

1. Log in to [Sprout Social](https://app.sproutsocial.com/)
2. Navigate to **Settings > API** (or contact your Sprout admin for API access)
3. Generate a new API token
4. See the [Sprout Social API docs](https://developers.sproutsocial.com/) for details

## License

MIT
