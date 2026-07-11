#!/usr/bin/env node
'use strict';

// git clean filter for MSW DataSet CSV files.
//
// The MSW Maker re-saves DataSet .csv files with a leading UTF-8 BOM
// (bytes EF BB BF), while agent scripts (fs.writeFileSync) write them
// without one. That makes git flag "phantom" modifications every time a
// file passes between the two tools, which then collide with pulls.
//
// This filter strips a single leading BOM on the way INTO the repo, so the
// stored blob is byte-identical regardless of which tool last wrote the file.
// Wired up via .gitattributes (`*.csv filter=msw-stripbom`) plus a one-time
// local config: git config filter.msw-stripbom.clean "node scripts/git-stripbom.cjs"

const chunks = [];
process.stdin.on('data', (c) => chunks.push(c));
process.stdin.on('end', () => {
  let buf = Buffer.concat(chunks);
  if (buf.length >= 3 && buf[0] === 0xef && buf[1] === 0xbb && buf[2] === 0xbf) {
    buf = buf.subarray(3);
  }
  process.stdout.write(buf);
});
