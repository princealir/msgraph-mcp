import { graphGet } from '../graph.js';

export const toolDefs = [
  {
    name: 'list_files',
    description: 'List files in OneDrive folder',
    inputSchema: {
      type: 'object',
      properties: {
        folder_path: { type: 'string', description: 'Folder path e.g. /Documents. Default: root' },
        limit: { type: 'number', description: 'Max files. Default: 50' },
      },
    },
  },
  {
    name: 'search_files',
    description: 'Search for files in OneDrive and SharePoint',
    inputSchema: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Search query' },
        limit: { type: 'number', description: 'Max results. Default: 25' },
      },
      required: ['query'],
    },
  },
  {
    name: 'get_file_info',
    description: 'Get metadata for a specific file by ID',
    inputSchema: {
      type: 'object',
      properties: {
        item_id: { type: 'string', description: 'OneDrive item ID' },
      },
      required: ['item_id'],
    },
  },
];

function formatItem(item) {
  return {
    id: item.id,
    name: item.name,
    type: item.folder ? 'folder' : 'file',
    size: item.size,
    lastModified: item.lastModifiedDateTime,
    webUrl: item.webUrl,
    mimeType: item.file?.mimeType,
    downloadUrl: item['@microsoft.graph.downloadUrl'],
    createdBy: item.createdBy?.user?.displayName,
  };
}

export async function handleTool(name, args) {
  switch (name) {
    case 'list_files': {
      const limit = args.limit || 50;
      let path;
      if (!args.folder_path || args.folder_path === '/' || args.folder_path === 'root') {
        path = `/me/drive/root/children`;
      } else {
        const p = args.folder_path.startsWith('/') ? args.folder_path.slice(1) : args.folder_path;
        path = `/me/drive/root:/${p}:/children`;
      }

      const data = await graphGet(path, {
        '$top': limit,
        '$select': 'id,name,size,lastModifiedDateTime,webUrl,file,folder,createdBy,@microsoft.graph.downloadUrl',
        '$orderby': 'lastModifiedDateTime desc',
      });
      return data.value.map(formatItem);
    }

    case 'search_files': {
      const limit = args.limit || 25;
      const data = await graphGet(`/me/drive/root/search(q='${encodeURIComponent(args.query)}')`, {
        '$top': limit,
        '$select': 'id,name,size,lastModifiedDateTime,webUrl,file,folder,createdBy',
      });
      return data.value.map(formatItem);
    }

    case 'get_file_info': {
      const item = await graphGet(`/me/drive/items/${args.item_id}`, {
        '$select': 'id,name,size,lastModifiedDateTime,webUrl,file,folder,createdBy,parentReference,@microsoft.graph.downloadUrl',
      });
      return {
        ...formatItem(item),
        parent: item.parentReference,
      };
    }
  }
}
