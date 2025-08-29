import {
  FileLibraryAssetFileType,
  FileLibraryAssetMimeType,
  FileLibraryAssetType,
} from '@onlyjs/db/client';

export const FILE_LIBRARY_ASSET_IMAGE_RULES = {
  allowedMimeTypes: [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'image/svg+xml',
    'image/bmp',
    'image/tiff',
  ],
  maxSize: 10 * 1024 * 1024, // 10MB
};

export const FILE_LIBRARY_ASSET_DOCUMENT_RULES = {
  allowedMimeTypes: [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  ],
  maxSize: 20 * 1024 * 1024, // 20MB
};

export const FILE_LIBRARY_ASSET_VIDEO_RULES = {
  allowedMimeTypes: ['video/mp4', 'video/avi', 'video/mpeg', 'video/webm', 'video/ogg'],
  maxSize: 10 * 1024 * 1024, // 10MB
};

export const FILE_LIBRARY_ASSET_TYPE_RULES = {
  //USER_IMAGE
  [FileLibraryAssetType.USER_IMAGE]: {
    validationRules: FILE_LIBRARY_ASSET_IMAGE_RULES,
    pathPrefix: ['users', 'images'],
    fileType: FileLibraryAssetFileType.IMAGE,
  },

  //AGENT_CHATBOT_IMAGE
  [FileLibraryAssetType.AGENT_CHATBOT_IMAGE]: {
    validationRules: FILE_LIBRARY_ASSET_IMAGE_RULES,
    pathPrefix: ['agents', 'chatbot-images'],
    fileType: FileLibraryAssetFileType.IMAGE,
  },

  //AGENT_RAG_DOCUMENT
  [FileLibraryAssetType.AGENT_RAG_DOCUMENT]: {
    validationRules: FILE_LIBRARY_ASSET_DOCUMENT_RULES,
    pathPrefix: ['agents', 'rag-documents'],
    fileType: FileLibraryAssetFileType.DOCUMENT,
  },
};

export const normalizeMimeType = (mimeType: string) => {
  const mimeTypesMapping = {
    //IMAGE
    'image/jpeg': FileLibraryAssetMimeType.IMAGE_JPEG,
    'image/png': FileLibraryAssetMimeType.IMAGE_PNG,
    'image/gif': FileLibraryAssetMimeType.IMAGE_GIF,
    'image/webp': FileLibraryAssetMimeType.IMAGE_WEBP,
    'image/svg+xml': FileLibraryAssetMimeType.IMAGE_SVG,
    'image/bmp': FileLibraryAssetMimeType.IMAGE_BMP,
    'image/tiff': FileLibraryAssetMimeType.IMAGE_TIFF,

    //VIDEO
    'video/mp4': FileLibraryAssetMimeType.VIDEO_MP4,
    'video/avi': FileLibraryAssetMimeType.VIDEO_AVI,
    'video/mpeg': FileLibraryAssetMimeType.VIDEO_MPEG,
    'video/webm': FileLibraryAssetMimeType.VIDEO_WEBM,
    'video/ogg': FileLibraryAssetMimeType.VIDEO_OGG,

    //DOCUMENT
    'application/pdf': FileLibraryAssetMimeType.DOCUMENT_PDF,
    'application/msword': FileLibraryAssetMimeType.DOCUMENT_MSWORD,
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': FileLibraryAssetMimeType.DOCUMENT_DOCX,
  };

  return mimeTypesMapping[mimeType as keyof typeof mimeTypesMapping];
};
