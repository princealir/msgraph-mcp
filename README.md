# msgraph-mcp

[![npm version](https://img.shields.io/npm/v/msgraph-mcp.svg)](https://www.npmjs.com/package/msgraph-mcp)
[![npm downloads](https://img.shields.io/npm/dm/msgraph-mcp.svg)](https://www.npmjs.com/package/msgraph-mcp)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

MCP server for Microsoft 365 — Mail, Calendar, Teams, OneDrive via Microsoft Graph API.

No Copilot license required. Uses device code login with your own Azure app. Only accesses **your own** data.

---

## Quick Start

```bash
npx msgraph-mcp --client-id YOUR_CLIENT_ID --tenant-id YOUR_TENANT_ID
```

On first run it shows a device code. Sign in at `https://microsoft.com/devicelogin`. Tokens are cached at `~/.ms-graph-mcp/token-cache.json`.

---

## Azure App Setup

### 1. Create App Registration

1. Go to [Azure Portal → App registrations](https://portal.azure.com/#view/Microsoft_AAD_RegisteredApps/ApplicationsListBlade)
2. Click **New registration**
3. Name: anything (e.g. `my-graph-mcp`)
4. Supported account types: **Single tenant** (or Multitenant if needed)
5. Click **Register**
6. Copy the **Application (client) ID** and **Directory (tenant) ID**

### 2. Enable Device Code Flow

1. In your app → **Authentication**
2. Click **Add a platform** → **Mobile and desktop applications**
3. Check `https://login.microsoftonline.com/common/oauth2/nativeclient`
4. Under **Advanced settings** → enable **Allow public client flows** → Yes
5. Click **Save**

### 3. Add API Permissions

Go to **API permissions** → **Add a permission** → **Microsoft Graph** → **Delegated**:

| Permission | Purpose |
|---|---|
| `Mail.Read` | Read emails |
| `Mail.Send` | Send emails |
| `Calendars.Read` | Read calendar |
| `Calendars.ReadWrite` | Create/update events |
| `Chat.Read` | Read Teams chats |
| `Channel.ReadBasic.All` | List channels in Teams |
| `ChannelMessage.Read.All` | Read Teams channel messages ⚠️ requires admin consent |
| `ChannelMessage.Send` | Send messages to channels |
| `Team.ReadBasic.All` | List Teams |
| `Files.Read.All` | Read OneDrive files |
| `User.Read` | Read user profile |
| `offline_access` | Keep tokens refreshed |

> **Note:** `ChannelMessage.Read.All` requires an admin to **Grant admin consent**. All other permissions work with user consent only.

---

## Configuration

### CLI flags

```bash
msgraph-mcp --client-id <id> --tenant-id <id>
```

### Environment variables

```bash
export MS_GRAPH_CLIENT_ID=your-client-id
export MS_GRAPH_TENANT_ID=your-tenant-id
msgraph-mcp
```

### MCP client config (Claude, Cursor, etc.)

```json
{
  "mcpServers": {
    "msgraph": {
      "command": "npx",
      "args": ["-y", "msgraph-mcp", "--client-id", "YOUR_ID", "--tenant-id", "YOUR_TENANT"]
    }
  }
}
```

Or with env vars:

```json
{
  "mcpServers": {
    "msgraph": {
      "command": "npx",
      "args": ["-y", "msgraph-mcp"],
      "env": {
        "MS_GRAPH_CLIENT_ID": "YOUR_ID",
        "MS_GRAPH_TENANT_ID": "YOUR_TENANT"
      }
    }
  }
}
```

### Clear cached tokens

```bash
msgraph-mcp --logout
```

---

## Tools

### Mail

| Tool | Description | Parameters |
|---|---|---|
| `list_emails` | List emails from a folder | `folder` (inbox/sentitems/drafts), `limit`, `unread_only` |
| `get_email` | Get full email with body | `id` |
| `send_email` | Send an email | `to[]`, `subject`, `body`, `body_type` (text/html), `cc[]` |
| `reply_email` | Reply to an email | `id`, `body` |

### Calendar

| Tool | Description | Parameters |
|---|---|---|
| `list_events` | List events in date range | `start_datetime`, `end_datetime`, `limit` |
| `get_event` | Get event details | `id` |
| `create_event` | Create a calendar event | `subject`, `start_datetime`, `end_datetime`, `timezone`, `body`, `attendees[]`, `is_online_meeting`, `location` |

### Teams

| Tool | Description | Parameters |
|---|---|---|
| `list_teams` | List joined Teams | — |
| `list_channels` | List channels in a Team | `team_id` |
| `list_channel_messages` | Get recent channel messages | `team_id`, `channel_id`, `limit` |
| `send_channel_message` | Post to a channel | `team_id`, `channel_id`, `body`, `content_type` |
| `list_chats` | List DMs and group chats | `limit` |
| `send_chat_message` | Send a DM or group message | `chat_id`, `body`, `content_type` |

### OneDrive

| Tool | Description | Parameters |
|---|---|---|
| `list_files` | List files in a folder | `folder_path`, `limit` |
| `search_files` | Search files across OneDrive | `query`, `limit` |
| `get_file_info` | Get file metadata | `item_id` |

### User

| Tool | Description | Parameters |
|---|---|---|
| `get_me` | Get your profile | — |
| `get_user` | Get another user's profile | `user_id` (email or object ID) |

---

## Integrations

All tools use the same base config. Replace `YOUR_CLIENT_ID` and `YOUR_TENANT_ID` throughout.

> **Sign-in note:** First run opens a device code prompt. Sign in once at `https://microsoft.com/devicelogin` — tokens auto-refresh after that.

---

### Claude Desktop

Config file:
- **Mac:** `~/Library/Application Support/Claude/claude_desktop_config.json`
- **Windows:** `%APPDATA%\Claude\claude_desktop_config.json`

```json
{
  "mcpServers": {
    "msgraph": {
      "command": "npx",
      "args": ["-y", "msgraph-mcp", "--client-id", "YOUR_CLIENT_ID", "--tenant-id", "YOUR_TENANT_ID"]
    }
  }
}
```

Restart Claude Desktop after saving.

---

### Claude Code (CLI)

```bash
claude mcp add msgraph npx -- -y msgraph-mcp --client-id YOUR_CLIENT_ID --tenant-id YOUR_TENANT_ID
```

Or add to `.claude/settings.json` in your project:

```json
{
  "mcpServers": {
    "msgraph": {
      "command": "npx",
      "args": ["-y", "msgraph-mcp", "--client-id", "YOUR_CLIENT_ID", "--tenant-id", "YOUR_TENANT_ID"]
    }
  }
}
```

---

### Cursor

Global config: `~/.cursor/mcp.json`
Project config: `.cursor/mcp.json` (checked into repo — use env vars to avoid committing IDs)

```json
{
  "mcpServers": {
    "msgraph": {
      "command": "npx",
      "args": ["-y", "msgraph-mcp"],
      "env": {
        "MS_GRAPH_CLIENT_ID": "YOUR_CLIENT_ID",
        "MS_GRAPH_TENANT_ID": "YOUR_TENANT_ID"
      }
    }
  }
}
```

---

### Windsurf

Config file: `~/.codeium/windsurf/mcp_config.json`

```json
{
  "mcpServers": {
    "msgraph": {
      "command": "npx",
      "args": ["-y", "msgraph-mcp"],
      "env": {
        "MS_GRAPH_CLIENT_ID": "YOUR_CLIENT_ID",
        "MS_GRAPH_TENANT_ID": "YOUR_TENANT_ID"
      }
    }
  }
}
```

---

### Cline (VS Code extension)

Open VS Code settings (`Cmd+,`) → search `cline.mcpServers` → Edit in settings.json:

```json
{
  "cline.mcpServers": {
    "msgraph": {
      "command": "npx",
      "args": ["-y", "msgraph-mcp", "--client-id", "YOUR_CLIENT_ID", "--tenant-id", "YOUR_TENANT_ID"]
    }
  }
}
```

Or use Cline's MCP panel → Add Server → paste the config.

---

### Continue (VS Code / JetBrains extension)

Config file: `~/.continue/config.json`

```json
{
  "mcpServers": [
    {
      "name": "msgraph",
      "command": "npx",
      "args": ["-y", "msgraph-mcp", "--client-id", "YOUR_CLIENT_ID", "--tenant-id", "YOUR_TENANT_ID"]
    }
  ]
}
```

---

### Zed

Open Zed settings (`Cmd+,`) and add under `context_servers`:

```json
{
  "context_servers": {
    "msgraph": {
      "command": {
        "path": "npx",
        "args": ["-y", "msgraph-mcp", "--client-id", "YOUR_CLIENT_ID", "--tenant-id", "YOUR_TENANT_ID"]
      }
    }
  }
}
```

---

### Hermes Agent (Nous Research)

Config file: `~/.hermes/config.yaml`

```yaml
mcp_servers:
  msgraph:
    command: "npx"
    args:
      - "-y"
      - "msgraph-mcp"
      - "--client-id"
      - "YOUR_CLIENT_ID"
      - "--tenant-id"
      - "YOUR_TENANT_ID"
```

---

### OpenClaw

Add to your OpenClaw gateway MCP config:

```json
{
  "mcpServers": {
    "msgraph": {
      "command": "npx",
      "args": ["-y", "msgraph-mcp"],
      "env": {
        "MS_GRAPH_CLIENT_ID": "YOUR_CLIENT_ID",
        "MS_GRAPH_TENANT_ID": "YOUR_TENANT_ID"
      }
    }
  }
}
```

Then restart the gateway: `openclaw gateway restart`

---

## Publishing to npm

```bash
cd msgraph-mcp
npm install
# update package.json with your name and repo URL
npm login
npm publish
```

---

## License

MIT
