import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';

import { toolDefs as mailDefs, handleTool as handleMail } from './tools/mail.js';
import { toolDefs as calDefs, handleTool as handleCalendar } from './tools/calendar.js';
import { toolDefs as teamsDefs, handleTool as handleTeams } from './tools/teams.js';
import { toolDefs as filesDefs, handleTool as handleFiles } from './tools/files.js';
import { toolDefs as userDefs, handleTool as handleUser } from './tools/user.js';

const ALL_TOOLS = [...mailDefs, ...calDefs, ...teamsDefs, ...filesDefs, ...userDefs];

const HANDLERS = {
  ...Object.fromEntries(mailDefs.map(t => [t.name, handleMail])),
  ...Object.fromEntries(calDefs.map(t => [t.name, handleCalendar])),
  ...Object.fromEntries(teamsDefs.map(t => [t.name, handleTeams])),
  ...Object.fromEntries(filesDefs.map(t => [t.name, handleFiles])),
  ...Object.fromEntries(userDefs.map(t => [t.name, handleUser])),
};

export async function startServer() {
  const server = new Server(
    { name: 'msgraph-mcp', version: '1.0.0' },
    { capabilities: { tools: {} } }
  );

  server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: ALL_TOOLS,
  }));

  server.setRequestHandler(CallToolRequestSchema, async (req) => {
    const { name, arguments: args } = req.params;
    const handler = HANDLERS[name];

    if (!handler) {
      return {
        content: [{ type: 'text', text: `Unknown tool: ${name}` }],
        isError: true,
      };
    }

    try {
      const result = await handler(name, args || {});
      return {
        content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
      };
    } catch (err) {
      return {
        content: [{ type: 'text', text: `Error: ${err.message}` }],
        isError: true,
      };
    }
  });

  const transport = new StdioServerTransport();
  await server.connect(transport);
  process.stderr.write('[msgraph-mcp] Server running on stdio\n');
}
