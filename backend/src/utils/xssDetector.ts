const XSS_PATTERNS = [
  /<script\b[^>]*>/i,
  /<\/script>/i,
  /javascript:/i,
  /\bon[a-zA-Z]+\s*=/i,
  /<\s*(iframe|object|embed|svg|img)\b/i
];

/**
 * Detects script tags or JavaScript payloads in user input.
 */
export const detectXss = (value: unknown): boolean => {
  if (typeof value !== 'string') {
    return false;
  }
  return XSS_PATTERNS.some(pattern => pattern.test(value));
};
