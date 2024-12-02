#!/usr/bin/env -S deno run --allow-env --allow-net --allow-read=.env,pkg
import { runWithConnectionPool } from './ibc-db.ts'
import { IBCReader } from './ibc-reader.ts'
import { sql } from './deps.ts'
console.log('Version:', IBCReader.version)
await IBCReader.initDecoder()
const reader = new IBCReader({
  'decode-progress' (event) { event.report() },
  async 'decode-success' (event) {
    event.report()
    await event.detail.context.pool!.query(sql.unsafe`
      SELECT jsonb_set(field, path, value)
      FROM transactions WHERE "txHash" = ${event.detail.txHash}
    `)
  },
  async 'decode-failure' (event) {
    event.report()
    await event.detail.context.pool!.query(sql.unsafe`
      SELECT jsonb_set(field, path, value)
      FROM transactions WHERE "txHash" = ${event.detail.txHash}
    `)
  },
})
await runWithConnectionPool(reader.run)
console.log('Errors encountered:')
for (const error of reader.errors) console.log(' ', error)
