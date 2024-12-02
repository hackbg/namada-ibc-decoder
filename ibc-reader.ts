import { IBCDecoder } from './ibc-decoder.ts'
import type { TX } from './ibc-decoder.ts'
import type { IBCEventHandlers } from './ibc-events.ts'
import { sql } from './deps.ts'
import type { DatabasePool } from './deps.ts'
import * as Config from './ibc-config.ts'

export const txContentColumn = sql.fragment`
  jsonb_path_query("txData", '$.data.content[*]') as txContent
`
export const txSectionsColumn = sql.fragment`
  "txData"->'data'->'sections' as txSections
`
export const withIbcTransactionsSubQuery = sql.fragment`with ibc_txs as (select
  "blockHeight",
  "txHash",
  ${txContentColumn},
  ${txSectionsColumn}
  from transactions)`
export const hasIbcTransactionClause = sql.fragment`
  (txcontent->>'type')::text = 'tx_ibc.wasm'
`
export const hasUndecodedIbcTransactionClause = sql.fragment`(
  (txcontent->'data'->>'decoderVersion' is NULL)
  or
  (txcontent->'data'->>'decoderVersion' != ${Config.IBC_DECODER_VERSION})
)`
export const allUndecodedIbcTransactionsQuery = sql.unsafe`
  ${withIbcTransactionsSubQuery} select * from ibc_txs
  where ${hasIbcTransactionClause} and ${hasUndecodedIbcTransactionClause}
  order by "blockHeight" desc;
`

export class IBCReader extends IBCDecoder {

  constructor (events: IBCEventHandlers = {}) {
    super()
    this.bindEvents(events)
  }

  pool?: DatabasePool

  run = async (pool: DatabasePool) => {
    this.pool = pool
    while (true) {
      console.log('🚀 Querying all undecoded IBC transactions...')
      await pool.stream(allUndecodedIbcTransactionsQuery, this.onStream)
      const delay = Config.IBC_DECODER_DELAY
      console.log('⏳ Waiting', delay, 'ms for any new transactions...')
      await new Promise(resolve=>setTimeout(resolve, 5000))
    }
  }

  onStream = (stream: TXStream) => stream.on('data', this.onData)

  onData = (tx: TX) => {
    //console.log(tx)
    return this.decodeTx(tx)
  }

}

interface TXStream { on: (event: string, cb: TXCallback) => unknown }

type TXCallback = (data: TX) => unknown

// More queries (some of them too slow:)

  //static countIbcTransactionsQuery = sql.unsafe`
    //${this.withIbcTransactionsQuery}
    //select count(*) from ids
      //where ${hasIbcTransactionClause}
      //order by "blockHeight" desc;
  //`

  //static allIbcTransactionsQuery = sql.unsafe`
    //${this.withIbcTransactionsQuery}
    //select * from ids
      //where ${hasIbcTransactionClause}
      //order by "blockHeight" desc;
  //`

  //static oldestIbcTransactionQuery = sql.unsafe`
    //${this.withIbcTransactionsQuery}
    //select * from ids
      //where ${hasIbcTransactionClause}
      //order by "blockHeight" asc limit 1;
  //`

  //static latestIbcTransactionQuery = sql.unsafe`
    //${this.withIbcTransactionsQuery}
    //select * from ids
      //where ${hasIbcTransactionClause}
      //order by "blockHeight" desc limit 1;
  //`

  //static oldestUndecodedIbcTransactionQuery = sql.unsafe`
    //${this.withIbcTransactionsQuery}
    //select * from ids
      //where ${hasIbcTransactionClause}
      //and ${hasUndecodedIbcTransactionClause}
      //order by "blockHeight" asc limit 1;
  //`

  //static latestUndecodedIbcTransactionQuery = sql.unsafe`
    //${this.withIbcTransactionsQuery}
    //select * from ids
      //where ${hasIbcTransactionClause}
      //and ${hasUndecodedIbcTransactionClause}
      //order by "blockHeight" desc limit 1;
  //`
