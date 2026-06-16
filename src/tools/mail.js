import { graphGet, graphPost } from '../graph.js';

export const toolDefs = [
  {
    name: 'list_emails',
    description: 'List emails from a mail folder',
    inputSchema: {
      type: 'object',
      properties: {
        folder: { type: 'string', description: 'Folder name (inbox, sentitems, drafts). Default: inbox' },
        limit: { type: 'number', description: 'Max emails to return. Default: 20' },
        unread_only: { type: 'boolean', description: 'Only return unread emails. Default: false' },
      },
    },
  },
  {
    name: 'get_email',
    description: 'Get a single email by ID including full body',
    inputSchema: {
      type: 'object',
      properties: {
        id: { type: 'string', description: 'Email message ID' },
      },
      required: ['id'],
    },
  },
  {
    name: 'send_email',
    description: 'Send an email',
    inputSchema: {
      type: 'object',
      properties: {
        to: { type: 'array', items: { type: 'string' }, description: 'Recipient email addresses' },
        subject: { type: 'string', description: 'Email subject' },
        body: { type: 'string', description: 'Email body content' },
        body_type: { type: 'string', enum: ['text', 'html'], description: 'Body content type. Default: text' },
        cc: { type: 'array', items: { type: 'string' }, description: 'CC recipients' },
      },
      required: ['to', 'subject', 'body'],
    },
  },
  {
    name: 'reply_email',
    description: 'Reply to an email',
    inputSchema: {
      type: 'object',
      properties: {
        id: { type: 'string', description: 'Email message ID to reply to' },
        body: { type: 'string', description: 'Reply body' },
      },
      required: ['id', 'body'],
    },
  },
];

export async function handleTool(name, args) {
  switch (name) {
    case 'list_emails': {
      const folder = args.folder || 'inbox';
      const limit = args.limit || 20;
      const params = {
        '$top': limit,
        '$select': 'id,subject,from,receivedDateTime,isRead,bodyPreview',
        '$orderby': 'receivedDateTime desc',
      };
      if (args.unread_only) params['$filter'] = 'isRead eq false';

      const data = await graphGet(`/me/mailFolders/${folder}/messages`, params);
      return data.value.map(m => ({
        id: m.id,
        subject: m.subject,
        from: m.from?.emailAddress,
        received: m.receivedDateTime,
        isRead: m.isRead,
        preview: m.bodyPreview,
      }));
    }

    case 'get_email': {
      const data = await graphGet(`/me/messages/${args.id}`, {
        '$select': 'id,subject,from,toRecipients,ccRecipients,receivedDateTime,isRead,body',
      });
      return {
        id: data.id,
        subject: data.subject,
        from: data.from?.emailAddress,
        to: data.toRecipients?.map(r => r.emailAddress),
        cc: data.ccRecipients?.map(r => r.emailAddress),
        received: data.receivedDateTime,
        isRead: data.isRead,
        bodyType: data.body?.contentType,
        body: data.body?.content,
      };
    }

    case 'send_email': {
      const message = {
        subject: args.subject,
        body: {
          contentType: args.body_type === 'html' ? 'HTML' : 'Text',
          content: args.body,
        },
        toRecipients: args.to.map(email => ({
          emailAddress: { address: email },
        })),
      };
      if (args.cc?.length) {
        message.ccRecipients = args.cc.map(email => ({
          emailAddress: { address: email },
        }));
      }
      await graphPost(`/me/sendMail`, { message, saveToSentItems: true });
      return { success: true, message: 'Email sent' };
    }

    case 'reply_email': {
      await graphPost(`/me/messages/${args.id}/reply`, {
        message: {},
        comment: args.body,
      });
      return { success: true, message: 'Reply sent' };
    }
  }
}
