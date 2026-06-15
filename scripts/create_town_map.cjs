const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const srcPath = path.join(__dirname, '..', 'map', 'map01.map');
const destPath = path.join(__dirname, '..', 'map', 'town.map');

console.log('Loading map01.map...');
let content = fs.readFileSync(srcPath, 'utf8');

// Find all UUIDs
const uuidRegex = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi;
const uuids = new Set(content.match(uuidRegex) || []);

console.log(`Found ${uuids.size} unique UUIDs in map01.map. Generating replacements...`);
const uuidMap = new Map();
for (const oldUuid of uuids) {
  uuidMap.set(oldUuid.toLowerCase(), crypto.randomUUID());
}

// Perform UUID replacement
console.log('Replacing UUIDs...');
content = content.replace(uuidRegex, (match) => {
  return uuidMap.get(match.toLowerCase()) || match;
});

// Replace map paths and names
console.log('Replacing map paths and name keys...');
content = content.replace(/\/maps\/map01/g, '/maps/town');
content = content.replace(/map:\/\/map01/g, 'map://town');
content = content.replace(/"name":\s*"map01"/g, '"name": "town"');

// Write the output
console.log('Writing town.map...');
fs.writeFileSync(destPath, content, 'utf8');
console.log('Successfully created town.map!');
