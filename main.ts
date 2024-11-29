#!/usr/bin/env -S deno run --allow-env --allow-net --allow-read=.env
import "jsr:@std/dotenv/load";
import { decodeHex } from "jsr:@std/encoding/hex";
import { createPool, sql } from 'npm:slonik';
import type { DatabasePool } from 'npm:slonik';
import { createPgDriverFactory } from 'npm:@slonik/pg-driver';

if (import.meta.main) main()

export default async function main () {
  await runWithConnectionPool(async pool=>{
    const query = sql.unsafe`
      with ids as (
        select
          "txHash",
          jsonb_path_query("txData", '$.data.content[*]')
            as txContent,
          "txData"->'data'->'sections'
            as txSections
        from
          transactions
      )
        select
          *
        from
          ids
        where
          (txContent->>'type')::text like '%ibc%';
    `
    let counter = 0
    await pool.stream(query, (stream: any) => stream.on('data', onData))
    async function onData (data: { data: any }) {
      const { txHash, txcontent, txsections } = data.data
      let next_is_ibc = false
      for (const i in txsections) {
        const section = txsections[i]
        if (next_is_ibc && (section.type === 'Data')) {
          counter++
          const bin = decodeHex(txsections[i].data)
          console.log(`IBC#${counter}: ${txHash}_${i}: ${bin.length}b:`, bin)
        }
        next_is_ibc = (section.type === 'Code' && section.tag === 'tx_ibc.wasm')
      } 
    }
  })
}

async function runWithConnectionPool (callback: (pool: DatabasePool)=>Promise<void>) {
  const url = Deno.env.get("KANEK6AN") || 'localhost:5432'
  const pool = await createPool(url, { driverFactory: createPgDriverFactory() })
  pool.on('error', (error: unknown) => { console.error(error); Deno.exit(1) })
  await callback(pool)
  await pool.end()
}
