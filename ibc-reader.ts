import { IBCDecoder } from './ibc-decoder.ts'
import { decodeHex, sql } from './deps.ts'
import type { DatabasePool } from './deps.ts'

export class IBCReader extends IBCDecoder {

  constructor (events: Record<string, (event: Event & { detail: unknown })=>unknown> = {}) {
    super()
    this.bindEvents(events)
  }

  run = (pool: DatabasePool) => pool.stream(IBCReader.query, this.onStream)

  onStream = (stream: Stream) => stream.on('data', this.onData)

  onData = (tx: TX) => {
    let next_is_ibc = false
    for (const sectionIndex in tx.data.txsections) {
      const section = tx.data.txsections[sectionIndex]
      if (next_is_ibc && (section.type === 'Data')) {
        this.decodeIbc(decodeHex(section.data), tx.data.txHash, sectionIndex)
      }
      next_is_ibc = (section.type === 'Code') && (section.tag === 'tx_ibc.wasm')
    }
  }

  static query = sql.unsafe`
    with ids as (
      select
        "txHash",
        jsonb_path_query("txData", '$.data.content[*]') as txContent,
        "txData"->'data'->'sections' as txSections
      from transactions
    ) select * from ids where (txContent->>'type')::text like '%ibc%';
  `

}

interface Stream { on: (event: string, cb: (data: TX)=>unknown)=>unknown }

interface TX { data: { txHash: string, txsections: Array<TXSection> } }

interface TXSection { type: string, tag: string, data: string, }
