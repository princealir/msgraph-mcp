import { graphGet, graphPost } from '../graph.js';

export const toolDefs = [
  {
    name: 'list_events',
    description: 'List calendar events in a date range',
    inputSchema: {
      type: 'object',
      properties: {
        start_datetime: { type: 'string', description: 'Start datetime ISO 8601. Default: now' },
        end_datetime: { type: 'string', description: 'End datetime ISO 8601. Default: 7 days from now' },
        limit: { type: 'number', description: 'Max events. Default: 10' },
      },
    },
  },
  {
    name: 'get_event',
    description: 'Get a calendar event by ID',
    inputSchema: {
      type: 'object',
      properties: {
        id: { type: 'string', description: 'Event ID' },
      },
      required: ['id'],
    },
  },
  {
    name: 'create_event',
    description: 'Create a calendar event',
    inputSchema: {
      type: 'object',
      properties: {
        subject: { type: 'string', description: 'Event title' },
        start_datetime: { type: 'string', description: 'Start datetime ISO 8601' },
        end_datetime: { type: 'string', description: 'End datetime ISO 8601' },
        timezone: { type: 'string', description: 'Timezone. Default: UTC' },
        body: { type: 'string', description: 'Event description' },
        attendees: { type: 'array', items: { type: 'string' }, description: 'Attendee email addresses' },
        is_online_meeting: { type: 'boolean', description: 'Create Teams meeting link. Default: false' },
        location: { type: 'string', description: 'Meeting location' },
      },
      required: ['subject', 'start_datetime', 'end_datetime'],
    },
  },
];

export async function handleTool(name, args) {
  switch (name) {
    case 'list_events': {
      const now = new Date();
      const start = args.start_datetime || now.toISOString();
      const end = args.end_datetime || new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString();
      const limit = args.limit || 10;

      const data = await graphGet(`/me/calendarView`, {
        startDateTime: start,
        endDateTime: end,
        '$top': limit,
        '$select': 'id,subject,start,end,location,organizer,attendees,isOnlineMeeting,onlineMeetingUrl',
        '$orderby': 'start/dateTime asc',
      });

      return data.value.map(e => ({
        id: e.id,
        subject: e.subject,
        start: e.start,
        end: e.end,
        location: e.location?.displayName,
        organizer: e.organizer?.emailAddress,
        attendees: e.attendees?.map(a => a.emailAddress),
        isOnlineMeeting: e.isOnlineMeeting,
        meetingUrl: e.onlineMeetingUrl,
      }));
    }

    case 'get_event': {
      const e = await graphGet(`/me/events/${args.id}`);
      return {
        id: e.id,
        subject: e.subject,
        start: e.start,
        end: e.end,
        body: e.body?.content,
        location: e.location?.displayName,
        organizer: e.organizer?.emailAddress,
        attendees: e.attendees?.map(a => ({ ...a.emailAddress, status: a.status?.response })),
        isOnlineMeeting: e.isOnlineMeeting,
        meetingUrl: e.onlineMeetingUrl,
      };
    }

    case 'create_event': {
      const tz = args.timezone || 'UTC';
      const event = {
        subject: args.subject,
        start: { dateTime: args.start_datetime, timeZone: tz },
        end: { dateTime: args.end_datetime, timeZone: tz },
        isOnlineMeeting: args.is_online_meeting || false,
      };

      if (args.body) {
        event.body = { contentType: 'Text', content: args.body };
      }
      if (args.location) {
        event.location = { displayName: args.location };
      }
      if (args.attendees?.length) {
        event.attendees = args.attendees.map(email => ({
          emailAddress: { address: email },
          type: 'required',
        }));
      }

      const created = await graphPost(`/me/events`, event);
      return {
        success: true,
        id: created.id,
        subject: created.subject,
        start: created.start,
        end: created.end,
        meetingUrl: created.onlineMeetingUrl,
        webLink: created.webLink,
      };
    }
  }
}
