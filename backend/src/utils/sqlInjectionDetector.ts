export interface SqlInjectionMatch {
  field: 'username' | 'password' | 'email';
  pattern: string;
  description: string;
}

interface DetectionPattern {
  pattern: RegExp;
  description: string;
}

const SQL_INJECTION_PATTERNS: DetectionPattern[] = [
  { pattern: /(--|#|\/\*|\*\/)/, description: 'SQL comment marker' },
  { pattern: /;\s*(select|insert|update|delete|drop|alter|truncate|create|exec|execute)\b/i, description: 'Stacked query indicator' },
  { pattern: /\bunion\s+(all\s+)?select\b/i, description: 'UNION SELECT pattern' },
  { pattern: /\b(or|and)\b\s+[\w'"]+\s*=\s*[\w'"]+/i, description: 'Boolean condition pattern' },
  { pattern: /\b(or|and)\b\s+\d+\s*=\s*\d+/i, description: 'Numeric boolean condition' },
  { pattern: /\b(or|and)\b\s+['"][^'"]+['"]\s*=\s*['"][^'"]+['"]/i, description: 'Quoted boolean condition' },
  { pattern: /\b(select|insert|update|delete|drop|alter|truncate|create)\b.+\b(from|where|table|database|schema|users)\b/i, description: 'Suspicious SQL keyword sequence' },
  { pattern: /\b(information_schema|load_file|benchmark|sleep|xp_cmdshell)\b/i, description: 'Suspicious database function or metadata access' }
];

export const detectSqlInjection = (fields: {
  username?: unknown;
  password?: unknown;
  email?: unknown;
}): SqlInjectionMatch[] => {
  const matches: SqlInjectionMatch[] = [];
  const candidates: Array<{ field: 'username' | 'password' | 'email'; value: unknown }> = [
    { field: 'username', value: fields.username },
    { field: 'password', value: fields.password },
    { field: 'email', value: fields.email }
  ];

  for (const candidate of candidates) {
    if (typeof candidate.value !== 'string') {
      continue;
    }

    for (const detectionPattern of SQL_INJECTION_PATTERNS) {
      const match = candidate.value.match(detectionPattern.pattern);
      if (match) {
        matches.push({
          field: candidate.field,
          pattern: match[0],
          description: detectionPattern.description
        });
      }
    }
  }

  return matches;
};
