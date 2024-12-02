#!/usr/bin/env -S deno run --allow-env --allow-net --allow-read=.env,pkg
import { runWithConnectionPool } from './ibc-db.ts'
import { IBCReader } from './ibc-reader.ts'
import { updateDecodeSuccess, updateDecodeFailure } from './ibc-writer.ts'

await IBCReader.initDecoder()

const reader = new IBCReader({

  'decode-progress' (event) {
    event.report(false)
  },

  async 'decode-success' (event) {
    event.report(false)
    await updateDecodeSuccess(event.detail, true)
  },

  async 'decode-failure' (event) {
    event.report()
    await updateDecodeFailure(event.detail, true)
  },

})

await runWithConnectionPool(reader.run)
