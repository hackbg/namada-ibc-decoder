import { sql, encodeHex } from './deps.ts'
import { IBCReader } from './ibc-reader.ts'
import { ibcSerialize } from './ibc-events.ts'
import type { IBCDecodeData, IBCDecodeSuccessData, IBCDecodeFailureData } from './ibc-events.ts'

const decoderVersion = IBCReader.version
console.log('Decoder version:', decoderVersion)

export async function updateDecodeSuccess (
  detail: IBCDecodeSuccessData<IBCReader>,
  dryRun: boolean = true
) {
  const updateIndex = await queryContentIndex(detail)
  logSuccessBefore(detail, updateIndex, dryRun)
  const result = { decoded: JSON.parse(ibcSerialize(detail.decoded)) }
  await updateDecodeResult(detail, result, updateIndex, dryRun)
  logSuccessAfter(detail, updateIndex, dryRun)
}

export async function updateDecodeFailure (
  detail: IBCDecodeFailureData<IBCReader>,
  dryRun: boolean = true
) {
  const updateIndex = await queryContentIndex(detail)
  logFailureBefore(detail, updateIndex, dryRun)
  const result = { error: detail.error.message }
  await updateDecodeResult(detail, result, updateIndex, dryRun)
  logFailureAfter(detail, updateIndex, dryRun)
}

export async function updateDecodeResult (
  detail: IBCDecodeData<IBCReader>,
  result: object,
  updateIndex: number,
  dryRun: boolean = true
) {
  const { context, txHash } = detail
  const updatedData = sql.jsonb({ decoderVersion, ...result })
  const updateQuery = dryRun ? sql.unsafe`
    select jsonb_set("txData", ${`{data,content,${updateIndex},data}`}, ${updatedData})
    from transactions where "txHash" = ${txHash}
  ` : sql.unsafe`${(()=>{throw new Error('todo')})()}`
  await context.pool!.one(updateQuery)
}

export async function queryContentIndex (detail: IBCDecodeData<IBCReader>) {
  const selectQuery = sql.unsafe`select * from transactions where "txHash" = ${detail.txHash}`
  const { txData: { data } } = await detail.context.pool!.one(selectQuery)
  const updateIndex = findContentIndex(data, detail.binary)
  return updateIndex
}

export function findContentIndex (data: TXData, binary: Uint8Array) {
  // Warning!!! This will fail if the TX section order
  // deviates from "...Code1, Data1... Code2, Data2..."
  // At time of writing, @fadroma/namada makes the same assumption.
  // (see PR https://github.com/hackbg/fadroma/pull/233 by @shurinov)
  let contentIndex = -1;
  const encodedBinary = encodeHex(binary)
  for (const section of data.sections) {
    if (isIBCCodeSection(section)) {
      contentIndex++
    } else if (isIBCDataSection(section, encodedBinary)) {
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

function isIBCCodeSection (section: TXSection) {
  return (section.type === 'Code') && (section.tag === 'tx_ibc.wasm')
}

function isIBCDataSection (section: TXSection, encodedBinary: string) {
  return (section.type === 'Data') && (section.data === encodedBinary)
}

export interface TXData {
  sections: Array<TXSection>
  batch:   Array<{
    code?: string|null
    data?: { binary?: string }|unknown
  }>
  content: Array<{
    type:  'tx_ibc.wasm'|string
    data:  object
  }>
}

export interface TXSection {
  type:  'Code'|'Data'|string
  tag:   'tx_ibc.wasm'|string|unknown
  data?: string
}

function logSuccessBefore (detail: IBCDecodeData<IBCReader>, updateIndex: number, dryRun: boolean) {
  const { ibcIndex, blockHeight, txHash } = detail
  const writing = dryRun ? `Would write success` : `Writing success`
  console.log('⏳', writing, 'IBC #', ibcIndex, 'at content #', updateIndex, 'of tx', txHash, 'in block', blockHeight)
}

function logSuccessAfter (detail: IBCDecodeData<IBCReader>, updateIndex: number, dryRun: boolean) {
  const { ibcIndex, blockHeight, txHash } = detail
  const wrote = dryRun ? `Would've written success` : `Wrote success`
  console.log('🟢', wrote, 'IBC #', ibcIndex, 'at content #', updateIndex, 'of tx', txHash, 'in block', blockHeight)
}

function logFailureBefore (detail: IBCDecodeData<IBCReader>, updateIndex: number, dryRun: boolean) {
  const { ibcIndex, blockHeight, txHash } = detail
  const writing = dryRun ? `Would write failure` : `Writing failure`
  console.log('⏳', writing, 'IBC #', ibcIndex, 'at content #', updateIndex, 'of tx', txHash, 'in block', blockHeight)
}

function logFailureAfter (detail: IBCDecodeData<IBCReader>, updateIndex: number, dryRun: boolean) {
  const { ibcIndex, blockHeight, txHash } = detail
  const wrote = dryRun ? `Would've written failure` : `Wrote failure`
  console.log('🟡', wrote, 'IBC #', ibcIndex, 'at content #', updateIndex, 'of tx', txHash, 'in block', blockHeight)
}
