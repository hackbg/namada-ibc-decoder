#!/usr/bin/env -S deno run --allow-env --allow-net --allow-read=.env,pkg
import "jsr:@std/dotenv/load"
import { encodeHex, decodeHex, createPool, sql, createPgDriverFactory } from './deps.ts'
import type { DatabasePool } from './deps.ts'
import initDecoder, { Decode } from './pkg/namada_ibc_decoder.js'

/** SemVer-compatible (actually TrunkVer) version identifier for this service.
  * This is stored in the database alongside the decoded data. */
const VERSION = Deno.env.get('IBC_DECODER_VERSION') || 'unspecified'

/** Open a PostgreSQL connection pool with `slonik` and pass it to a callback.
  * When the callback is done executing, close the connection pool. */
async function runWithConnectionPool (callback: (pool: DatabasePool)=>unknown) {
  const url = Deno.env.get("IBC_DECODER_DB") || 'localhost:5432'
  const driverFactory = createPgDriverFactory()
  const statementTimeout = 'DISABLE_TIMEOUT'
  const pool = await createPool(url, { driverFactory, statementTimeout })
  pool.on('error', (error: unknown) => { console.error(error); Deno.exit(1) })
  await callback(pool)
  await pool.end()
}

export class StreamingIBCDecoder {

  constructor (events: Record<string, ()=>unknown> = {}) {
    this.version = VERSION
    this.stats   = new Stats()
    this.events  = new EventTarget()
    for (const [event, handler] of Object.entries(events)) {
      this.events.addEventListener(event, handler)
    }
  }

  version: string
  events:  EventTarget
  stats:   Stats

  async run () {
    await StreamingIBCDecoder.init()
    return await runWithConnectionPool(this.onPool)
  }

  static async init () {
    if (!StreamingIBCDecoder.decoder) {
      const wasm = await Deno.readFile('./pkg/namada_ibc_decoder_bg.wasm')
      StreamingIBCDecoder.decoder = await initDecoder({ module_or_path: wasm })
    }
    return StreamingIBCDecoder.decoder
  }

  static decoder: { decode_ibc: (bin: Uint8Array)=>object }

  onPool = (pool: DatabasePool) => {
    return pool.stream(StreamingIBCDecoder.query, this.onStream)
  }

  static query = sql.unsafe`
    with ids as (
      select
        "txHash",
        jsonb_path_query("txData", '$.data.content[*]') as txContent,
        "txData"->'data'->'sections' as txSections
      from transactions
    ) select * from ids where (txContent->>'type')::text like '%ibc%';`

  onStream = (stream: Stream) => {
    return stream.on('data', this.onData)
  }

  onData = (data: TX) => {
    const { txHash, txsections } = data.data
    let next_is_ibc = false
    for (const i in txsections) {
      const section = txsections[i]
      if (next_is_ibc && (section.type === 'Data')) {
        this.decodeIbc(decodeHex(txsections[i].data), txHash, i)
      }
      next_is_ibc = (section.type === 'Code') && (section.tag === 'tx_ibc.wasm')
    }
  }

  decodeIbc (bin: Uint8Array, txHash: string, i: string) {
    const prefix = `IBC#${this.stats.total}: ${txHash}_${i}: ${bin.length}b:`
    this.stats.total++
    try {
      this.decodeIbcSuccess(prefix, Decode.ibc(bin) as DecodedIBC)
    } catch (e: unknown) {
      this.decodeIbcFailure(prefix, e)
    }
  }

  decodeIbcSuccess (prefix: string, ibc: DecodedIBC) {
    this.stats.ibcDecoded(ibc.type, ibc?.clientMessage?.typeUrl)
    console.log('🟢', prefix, JSON.stringify(ibc, StreamingIBCDecoder.serializer, 2))
  }

  static serializer (_: unknown, value: unknown) {
    if (value instanceof Uint8Array) return encodeHex(value)
    if (typeof value === 'bigint') return String(value)
    return value
  }

  decodeIbcFailure (prefix: string, e: unknown) {
    this.stats.ibcDecodeFailed(prefix, e)
    console.error('🔴', e)
    console.error('🔴', `${prefix} decode failed ${(e as { message: string }).message}`)
  }
}

export class Stats {
  total    = 0
  decoded  = 0
  failed   = 0
  typeUrls: Set<string> = new Set()
  ibcTypes: Record<string, number> = {}
  errors:   Array<[string, unknown]> = []

  ibcEncountered () {
    this.total++
  }
  ibcDecoded (type: string, typeUrl?: string) {
    this.ibcTypes[type] ??= 0
    this.ibcTypes[type]++
    if (typeUrl) {
      this.typeUrls.add(typeUrl)
    }
    this.decoded++
  }
  ibcDecodeFailed (prefix: string, error: unknown) {
    this.errors.push([prefix, error])
    this.failed++
  }
}

interface Stream { on: (event: string, cb: (data: TX)=>unknown)=>unknown }

interface DecodedIBC { type: string, clientMessage?: { typeUrl?: string }, [k: string]: unknown }

interface TX { data: { txHash: string, txsections: Array<TXSection> } }

interface TXSection { type: string, tag: string, data: string, }
