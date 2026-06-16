const fs = require('fs');
const path = require('path');

const logsDir = path.join(__dirname, '../logs');

function formatValue(val) {
  if (val === null || val === undefined) return '""';
  if (typeof val === 'object') {
    return `"${JSON.stringify(val).replace(/"/g, '\\"')}"`;
  }
  return `"${String(val).replace(/"/g, '\\"')}"`;
}

function convertLine(line) {
  if (!line.trim()) return null;
  try {
    const data = JSON.parse(line);
    const { timestamp, level, message, ...meta } = data;
    if (!timestamp || !level || !message) return null;

    // Flatten nested objects like actor for easier Splunk querying
    const flatMeta = {};
    Object.entries(meta).forEach(([key, val]) => {
      if (val && typeof val === 'object' && !Array.isArray(val)) {
        Object.entries(val).forEach(([nestedKey, nestedVal]) => {
          flatMeta[`${key}_${nestedKey}`] = nestedVal;
        });
      } else {
        flatMeta[key] = val;
      }
    });

    const metaPairs = Object.entries(flatMeta)
      .map(([key, val]) => `${key}=${formatValue(val)}`)
      .join(' ');

    return `${timestamp} level="${level}" message="${message.replace(/"/g, '\\"')}" ${metaPairs}`.trim();
  } catch (e) {
    return null;
  }
}

function migrateFile(jsonFile, textFile) {
  const jsonPath = path.join(logsDir, jsonFile);
  const textPath = path.join(logsDir, textFile);

  if (!fs.existsSync(jsonPath)) {
    console.log(`JSON file ${jsonFile} does not exist.`);
    return;
  }

  const content = fs.readFileSync(jsonPath, 'utf8');
  const lines = content.split('\n');
  const converted = [];

  for (const line of lines) {
    const convertedLine = convertLine(line);
    if (convertedLine) {
      converted.push(convertedLine);
    }
  }

  fs.writeFileSync(textPath, converted.join('\n') + '\n', 'utf8');
  console.log(`Migrated ${converted.length} lines from ${jsonFile} to ${textFile}.`);
}

migrateFile('application.json.log', 'application.log');
migrateFile('security.json.log', 'security.log');
