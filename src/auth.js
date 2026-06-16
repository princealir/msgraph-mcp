import { PublicClientApplication } from '@azure/msal-node';
import { readFile, writeFile, mkdir } from 'fs/promises';
import { homedir } from 'os';
import { join, dirname } from 'path';

const CACHE_PATH = join(homedir(), '.ms-graph-mcp', 'token-cache.json');

const SCOPES = [
  'Mail.Read',
  'Mail.Send',
  'Calendars.Read',
  'Calendars.ReadWrite',
  'Chat.Read',
  'Channel.ReadBasic.All',
  'ChannelMessage.Read.All',
  'ChannelMessage.Send',
  'Team.ReadBasic.All',
  'Files.Read.All',
  'User.Read',
  'offline_access',
];

const cachePlugin = {
  beforeCacheAccess: async (ctx) => {
    try {
      const data = await readFile(CACHE_PATH, 'utf-8');
      ctx.tokenCache.deserialize(data);
    } catch {}
  },
  afterCacheAccess: async (ctx) => {
    if (ctx.cacheHasChanged) {
      await mkdir(dirname(CACHE_PATH), { recursive: true });
      await writeFile(CACHE_PATH, ctx.tokenCache.serialize(), 'utf-8');
    }
  },
};

function createApp() {
  const clientId = process.env.MS_GRAPH_CLIENT_ID;
  const tenantId = process.env.MS_GRAPH_TENANT_ID;

  if (!clientId || !tenantId) {
    throw new Error(
      'Missing MS_GRAPH_CLIENT_ID or MS_GRAPH_TENANT_ID. ' +
      'Pass --client-id and --tenant-id or set env vars.'
    );
  }

  return new PublicClientApplication({
    auth: {
      clientId,
      authority: `https://login.microsoftonline.com/${tenantId}`,
    },
    cache: { cachePlugin },
  });
}

let _app = null;

function getApp() {
  if (!_app) _app = createApp();
  return _app;
}

export async function getAccessToken() {
  const app = getApp();
  const cache = app.getTokenCache();
  const accounts = await cache.getAllAccounts();

  if (accounts.length > 0) {
    try {
      const result = await app.acquireTokenSilent({ account: accounts[0], scopes: SCOPES });
      return result.accessToken;
    } catch {}
  }

  const result = await app.acquireTokenByDeviceCode({
    scopes: SCOPES,
    deviceCodeCallback: (response) => {
      process.stderr.write(`\n[msgraph-mcp] Login required:\n`);
      process.stderr.write(`  Go to: ${response.verificationUri}\n`);
      process.stderr.write(`  Enter code: ${response.userCode}\n\n`);
    },
  });

  return result.accessToken;
}

export async function logout() {
  try {
    await writeFile(CACHE_PATH, JSON.stringify({}), 'utf-8');
    process.stderr.write('[msgraph-mcp] Logged out. Token cache cleared.\n');
  } catch {}
}
