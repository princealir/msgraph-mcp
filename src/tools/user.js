import { graphGet } from '../graph.js';

export const toolDefs = [
  {
    name: 'get_me',
    description: 'Get the signed-in user profile',
    inputSchema: { type: 'object', properties: {} },
  },
  {
    name: 'get_user',
    description: 'Get another user profile by email or user ID',
    inputSchema: {
      type: 'object',
      properties: {
        user_id: { type: 'string', description: 'User email or Azure AD object ID' },
      },
      required: ['user_id'],
    },
  },
];

export async function handleTool(name, args) {
  switch (name) {
    case 'get_me': {
      const data = await graphGet('/me', {
        '$select': 'id,displayName,mail,userPrincipalName,jobTitle,department,officeLocation,mobilePhone,businessPhones',
      });
      return data;
    }

    case 'get_user': {
      const data = await graphGet(`/users/${encodeURIComponent(args.user_id)}`, {
        '$select': 'id,displayName,mail,userPrincipalName,jobTitle,department,officeLocation',
      });
      return data;
    }
  }
}
