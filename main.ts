#!/usr/bin/env -S deno run --allow-env --allow-net --allow-read=.env,pkg
import { runWithConnectionPool } from './ibc-db.ts'
import { IBCReader } from './ibc-reader.ts'
import { sql } from './deps.ts'
console.log('Version:', IBCReader.version)
await IBCReader.initDecoder()
const reader = new IBCReader({

  'decode-progress' (event) {
    event.report()
  },

  async 'decode-success' (event) {
    event.report()
    const {context, txHash, sectionIndex} = event.detail
    console.log('⏳ Writing result for', txHash, '/', sectionIndex, '...')
    try {
      await context.pool!.query(sql.unsafe`
        SELECT jsonb_set("txData"->'data'->'sections', path, value)
        FROM transactions WHERE "txHash" = ${event.detail.txHash}
      `)
      console.log('🟢 Updated', txHash, '/', sectionIndex)
    } catch (e) {
      console.error('🔴 Failed to update', txHash, '/', sectionIndex, ':')
      console.error(e)
    }
  },

  async 'decode-failure' (event) {
    event.report()
    const {context, txHash, sectionIndex} = event.detail
    console.log('⏳ Writing failure for', txHash, '/', sectionIndex, '...')
    try {
      await context.pool!.query(sql.unsafe`
        SELECT jsonb_set("txData"->'data'->'sections', path, value)
        FROM transactions WHERE "txHash" = ${event.detail.txHash}
      `)
      console.log('🟡 Updated', txHash, '/', sectionIndex)
    } catch (e) {
      console.error('🔴 Failed to update', txHash, '/', sectionIndex, ':')
      console.error(e)
    }
  },

})
await runWithConnectionPool(reader.run)
console.log('Errors encountered:')
for (const error of reader.errors) console.log(' ', error)
