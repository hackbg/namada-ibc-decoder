#!/usr/bin/env -S deno run --allow-env --allow-net --allow-read=.env,pkg
// deno-lint-ignore-file no-explicit-any
import { runWithConnectionPool } from './ibc-db.ts'
import { IBCReader } from './ibc-reader.ts'
import type { IBCDecodeProgress, IBCDecodeSuccess, IBCDecodeFailure } from './ibc-decoder.ts'
console.log('Version:', IBCReader.version)
await IBCReader.initDecoder()
const reader = new IBCReader({
  'decode-progress': (event) => {
    (event as IBCDecodeProgress).report()
  },
  'decode-success': (event) => {
    (event as IBCDecodeSuccess<any>).report()
  },
  'decode-failure': (event) => {
    (event as IBCDecodeFailure<any>).report()
  }
})
await runWithConnectionPool(reader.run)
console.log('Errors encountered:')
for (const error of reader.errors) console.log(' ', error)
