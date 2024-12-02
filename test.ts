#!/usr/bin/env -S deno run --allow-env --allow-net --allow-read=.env,pkg
import { runWithConnectionPool } from './ibc-db.ts'
import { IBCReader } from './ibc-reader.ts'
import { ibcSerialize } from './ibc-events.ts'
import { sql, encodeHex } from './deps.ts'
const decoderVersion = IBCReader.version
console.log('Version:', decoderVersion)
await IBCReader.initDecoder()
const reader = new IBCReader({

  'decode-progress' (event) { event.report(false) },

  async 'decode-success' (event) {
    event.report(false)
    const { context, ibcIndex, binary, blockHeight, txHash, decoded } = event.detail
    const selectQuery = sql.unsafe`select * from transactions where "txHash" = ${txHash}`
    const { txData: { data } } = await context.pool!.one(selectQuery)
    const updateIndex = findContentIndex(data, binary)
    console.log(
      '🖋️ Writing IBC #', ibcIndex, 'at content #', updateIndex,
      'of tx', txHash, 'in block', blockHeight
    )
    const updatedData = sql.jsonb({
      decoderVersion,
      decoded: JSON.parse(ibcSerialize(decoded)) 
    })
    const updateQuery = sql.unsafe`
      select jsonb_set("txData", ${`{data,content,${updateIndex},data}`}, ${updatedData})
      from transactions where "txHash" = ${event.detail.txHash}
    `
    await context.pool!.one(updateQuery)
    console.log(
      '🚀 Wrote IBC #', ibcIndex, 'at content #', updateIndex,
      'of tx', txHash, 'in block', blockHeight
    )
  },

  async 'decode-failure' (event) {
    event.report()
  },

})
await runWithConnectionPool(reader.run)
console.log('Errors encountered:')
for (const error of reader.errors) console.log(' ', error)

function findContentIndex (data: TXData, binary: Uint8Array) {
  let contentIndex = -1;
  for (const section of data.sections) {
    if (section.type === 'Code' && section.tag === 'tx_ibc.wasm') {
      contentIndex++
      continue
    }
    if (section.type === 'Data' && section.data === encodeHex(binary)) {
      break
    }
  }
  if (contentIndex === -1) {
    throw new Error('Could not find matching contentIndex')
  }
  const content = data.content[contentIndex]
  if (content?.type !== 'tx_ibc.wasm') {
    throw new Error(`Could not find tx_ibc.wasm at contentIndex ${contentIndex}`)
  }
  return contentIndex
}

interface TXData {
  sections: Array<{
    type:  'Code'|'Data'|string
    tag:   'tx_ibc.wasm'|string|unknown
    data?: string
  }>
  batch:   Array<{
    code?: string|null
    data?: { binary?: string }|unknown
  }>
  content: Array<{
    type:  'tx_ibc.wasm'|string
    data:  object
  }>
}
