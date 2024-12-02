import { IBCDecoder } from './ibc-decoder.ts'
import type { TX } from './ibc-reader.ts'
import type { IBCEventHandlers } from './ibc-events.ts'
import { decodeHex, sql } from './deps.ts'
import type { DatabasePool } from './deps.ts'

export class IBCReader extends IBCDecoder {

  constructor (events: IBCEventHandlers = {}) {
    super()
    this.bindEvents(events)
  }

  pool?: DatabasePool

  run = (pool: DatabasePool) => {
    this.pool = pool
    return pool.stream(IBCReader.query, this.onStream)
  }

  onStream = (stream: TXStream) => stream.on('data', this.onData)

  onData = (tx: TX) => this.decodeTx(tx)

  static query = sql.unsafe`
    with ids as (
      select
        "blockHeight",
        "txHash",
        jsonb_path_query("txData", '$.data.content[*]') as txContent,
        "txData"->'data'->'sections' as txSections
      from transactions
    )
    select * from ids
      where (txContent->>'type')::text like '%ibc%'
      order by "blockHeight" desc;
  `

}

interface TXStream { on: (event: string, cb: (data: TX)=>unknown)=>unknown }
