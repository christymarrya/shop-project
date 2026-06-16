const BACKEND_BASE_URL = 'http://localhost:5000';

/**
 * Resolves product image URLs.
 * If the URL starts with http:// or https://, it is returned as-is.
 * Otherwise, it is assumed to be a relative path and is prepended with the backend base URL.
 */
export const getProductImageUrl = (url: string | null | undefined): string => {
  if (!url) return '';

  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }

  // Prepend backend base URL to relative local upload paths
  const cleanUrl = url.startsWith('/') ? url : `/${url}`;
  return `${BACKEND_BASE_URL}${cleanUrl}`;
};
