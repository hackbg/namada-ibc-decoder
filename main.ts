#!/usr/bin/env -S deno run --allow-env --allow-net --allow-read=.env,pkg
import "jsr:@std/dotenv/load";
import { decodeHex } from "jsr:@std/encoding/hex";
import { createPool, sql } from 'npm:slonik';
import type { DatabasePool } from 'npm:slonik';
import { createPgDriverFactory } from 'npm:@slonik/pg-driver';
import initDecoder, { Decode } from './pkg/namada_ibc_decoder.js';

export class StreamingIBCDecoder {

  static query = sql.unsafe`
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

  static decoder: { decode_ibc: (bin: Uint8Array)=>object }

  static async init () {
    if (!StreamingIBCDecoder.decoder) {
      const wasm = await Deno.readFile('./pkg/namada_ibc_decoder_bg.wasm')
      StreamingIBCDecoder.decoder = await initDecoder({ module_or_path: wasm })
    }
    return StreamingIBCDecoder.decoder
  }

  total   = 0
  decoded = 0
  failed  = 0

  typeUrls = new Set()

  async run () {
    await StreamingIBCDecoder.init()
    return await runWithConnectionPool((pool: DatabasePool)=>
      pool.stream(StreamingIBCDecoder.query, (stream)=>
        stream.on('data', this.onData)
      )
    )
  }

  onData = (data: {
    data: {
      txHash:     string,
      txsections: Array<{
        type:     string,
        tag:      string,
        data:     string,
      }> }
  }) => {
    const { txHash, txsections } = data.data
    let next_is_ibc = false
    for (const i in txsections) {
      const section = txsections[i]
      if (next_is_ibc && (section.type === 'Data')) {
        this.total++
        const bin = decodeHex(txsections[i].data)
        const prefix = `IBC#${this.total}: ${txHash}_${i}: ${bin.length}b:`
        try {
          const ibc: any = Decode.ibc(bin)
          if (ibc?.clientMessage?.typeUrl) {
            this.typeUrls.add(ibc?.clientMessage?.typeUrl)
          }
          console.log('🟢', prefix, ibc)
          this.decoded++
        } catch (e: any) {
          console.error('🔴', e)
          console.error('🔴', `${prefix} decode failed ${e.message}`)
          this.failed++
        }
      }
      next_is_ibc = (section.type === 'Code' && section.tag === 'tx_ibc.wasm')
    }
  }
}

if (import.meta.main) {
  const decoder = new StreamingIBCDecoder()
  await decoder.run()
  console.log({
    total:    decoder.total,
    decoded:  decoder.decoded,
    failed:   decoder.failed,
    typeUrls: decoder.typeUrls,
  })
}

async function runWithConnectionPool (callback: (pool: DatabasePool)=>unknown) {
  const url = Deno.env.get("KANEK6AN") || 'localhost:5432'
  const driverFactory = createPgDriverFactory()
  const statementTimeout = 'DISABLE_TIMEOUT'
  const pool = await createPool(url, { driverFactory, statementTimeout })
  pool.on('error', (error: unknown) => { console.error(error); Deno.exit(1) })
  await callback(pool)
  await pool.end()
}
