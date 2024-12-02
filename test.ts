#!/usr/bin/env -S deno run --allow-env --allow-net --allow-read=.env,pkg
import { runWithConnectionPool } from './ibc-db.ts'
import { IBCReader } from './ibc-reader.ts'
console.log('Version:', IBCReader.version)
await IBCReader.initDecoder()
const reader = new IBCReader({
  'decode-progress' (event) { event.report() },
  'decode-success'  (event) { event.report(true) },
  'decode-failure'  (event) { event.report() },
})
await runWithConnectionPool(reader.run)
console.log('Errors encountered:')
for (const error of reader.errors) console.log(' ', error)
