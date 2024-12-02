#!/usr/bin/env -S deno run --allow-env --allow-net --allow-read=.env,pkg
import { runWithConnectionPool } from './ibc-db.ts'
import { IBCReader } from './ibc-reader.ts'
import type { IBCDecodeProgressEvent, IBCDecodeSuccessEvent, IBCDecodeFailureEvent } from './ibc-decoder.ts'
console.log(IBCReader.version)
await IBCReader.initDecoder()
const reader = new IBCReader({
  'decode-progress': (event) => {
    (event as IBCDecodeProgressEvent).report()
  },
  'decode-success': (event) => {
    (event as IBCDecodeSuccessEvent).report()
  },
  'decode-failure': (event) => {
    (event as IBCDecodeFailureEvent).report()
  }
})
await runWithConnectionPool(reader.onPool)
console.log('Errors encountered:')
for (const error of reader.errors) console.log(' ', error)
