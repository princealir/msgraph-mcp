import { graphGet, graphPost } from '../graph.js';

export const toolDefs = [
  {
    name: 'list_teams',
    description: 'List all Teams the user is a member of',
    inputSchema: { type: 'object', properties: {} },
  },
  {
    name: 'list_channels',
    description: 'List channels in a Team',
    inputSchema: {
      type: 'object',
      properties: {
        team_id: { type: 'string', description: 'Team ID' },
      },
      required: ['team_id'],
    },
  },
  {
    name: 'list_channel_messages',
    description: 'Get recent messages from a Teams channel',
    inputSchema: {
      type: 'object',
      properties: {
        team_id: { type: 'string', description: 'Team ID' },
        channel_id: { type: 'string', description: 'Channel ID' },
        limit: { type: 'number', description: 'Max messages. Default: 20' },
      },
      required: ['team_id', 'channel_id'],
    },
  },
  {
    name: 'send_channel_message',
    description: 'Send a message to a Teams channel',
    inputSchema: {
      type: 'object',
      properties: {
        team_id: { type: 'string', description: 'Team ID' },
        channel_id: { type: 'string', description: 'Channel ID' },
        body: { type: 'string', description: 'Message body (supports HTML)' },
        content_type: { type: 'string', enum: ['text', 'html'], description: 'Content type. Default: text' },
      },
      required: ['team_id', 'channel_id', 'body'],
    },
  },
  {
    name: 'list_chats',
    description: 'List recent chats (DMs and group chats)',
    inputSchema: {
      type: 'object',
      properties: {
        limit: { type: 'number', description: 'Max chats. Default: 20' },
      },
    },
  },
  {
    name: 'send_chat_message',
    description: 'Send a message to a chat (DM or group)',
    inputSchema: {
      type: 'object',
      properties: {
        chat_id: { type: 'string', description: 'Chat ID' },
        body: { type: 'string', description: 'Message body' },
        content_type: { type: 'string', enum: ['text', 'html'], description: 'Content type. Default: text' },
      },
      required: ['chat_id', 'body'],
    },
  },
];

export async function handleTool(name, args) {
  switch (name) {
    case 'list_teams': {
      const data = await graphGet(`/me/joinedTeams`, {
        '$select': 'id,displayName,description',
      });
      return data.value;
    }

    case 'list_channels': {
      const data = await graphGet(`/teams/${args.team_id}/channels`, {
        '$select': 'id,displayName,description,membershipType',
      });
      return data.value;
    }

    case 'list_channel_messages': {
      const limit = args.limit || 20;
      const data = await graphGet(
        `/teams/${args.team_id}/channels/${args.channel_id}/messages`,
        { '$top': limit }
      );
      return data.value.map(m => ({
        id: m.id,
        from: m.from?.user?.displayName || m.from?.application?.displayName,
        createdDateTime: m.createdDateTime,
        body: m.body?.content,
        bodyType: m.body?.contentType,
        mentions: m.mentions?.map(mention => mention.mentioned?.user?.displayName),
      }));
    }

    case 'send_channel_message': {
      const msg = await graphPost(
        `/teams/${args.team_id}/channels/${args.channel_id}/messages`,
        {
          body: {
            contentType: args.content_type === 'html' ? 'html' : 'text',
            content: args.body,
          },
        }
      );
      return { success: true, id: msg.id, createdDateTime: msg.createdDateTime };
    }

    case 'list_chats': {
      const limit = args.limit || 20;
      const data = await graphGet(`/me/chats`, {
        '$top': limit,
        '$select': 'id,chatType,topic,lastUpdatedDateTime',
        '$expand': 'members($select=displayName,email)',
        '$orderby': 'lastUpdatedDateTime desc',
      });
      return data.value.map(c => ({
        id: c.id,
        type: c.chatType,
        topic: c.topic,
        lastUpdated: c.lastUpdatedDateTime,
        members: c.members?.map(m => ({ name: m.displayName, email: m.email })),
      }));
    }

    case 'send_chat_message': {
      const msg = await graphPost(`/me/chats/${args.chat_id}/messages`, {
        body: {
          contentType: args.content_type === 'html' ? 'html' : 'text',
          content: args.body,
        },
      });
      return { success: true, id: msg.id, createdDateTime: msg.createdDateTime };
    }
  }
}
