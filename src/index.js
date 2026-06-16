#!/usr/bin/env node

import { parseArgs } from 'util';

const { values } = parseArgs({
  options: {
    'client-id': { type: 'string' },
    'tenant-id': { type: 'string' },
    'logout': { type: 'boolean' },
    'help': { type: 'boolean', short: 'h' },
  },
  strict: false,
});

if (values.help) {
  process.stdout.write(`
msgraph-mcp — Microsoft Graph MCP Server

Usage:
  npx msgraph-mcp --client-id <id> --tenant-id <id>
  msgraph-mcp --client-id <id> --tenant-id <id>

Options:
  --client-id    Azure app client ID (or set MS_GRAPH_CLIENT_ID)
  --tenant-id    Azure tenant ID (or set MS_GRAPH_TENANT_ID)
  --logout       Clear cached tokens
  -h, --help     Show this help

Environment variables:
  MS_GRAPH_CLIENT_ID    Azure app client ID
  MS_GRAPH_TENANT_ID    Azure tenant ID

`);
  process.exit(0);
}

if (values['client-id']) process.env.MS_GRAPH_CLIENT_ID = values['client-id'];
if (values['tenant-id']) process.env.MS_GRAPH_TENANT_ID = values['tenant-id'];

if (values.logout) {
  const { logout } = await import('./auth.js');
  await logout();
  process.exit(0);
}

const { startServer } = await import('./server.js');
await startServer();
