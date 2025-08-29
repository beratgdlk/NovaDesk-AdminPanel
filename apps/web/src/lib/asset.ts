import { env } from "#config/env";

export const getAsset = (path: string) => {
  if (path.startsWith("http") || path.startsWith("data:image") || path.startsWith("blob:")) {
    return path;
  }
  return `${env.apiUrl}/storage/${path}`;
};