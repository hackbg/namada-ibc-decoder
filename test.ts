#!/usr/bin/env -S deno run --allow-env --allow-net --allow-read=.env,pkg
import { runWithConnectionPool } from './ibc-db.ts'
import { IBCReader } from './ibc-reader.ts'
import type { IBCDecodeProgressEvent, IBCDecodeSuccessEvent, IBCDecodeFailureEvent } from './ibc-decoder.ts'
console.log(IBCReader.version)
await IBCReader.initDecoder()

const reader = new IBCReader({
  'decode-progress': (event) => {
    const {detail} = event as IBCDecodeProgressEvent
    const {total, decoded, failed, ibcTypes, typeUrls} = detail
    console.log()
    console.log(`\n😼 Decoded ${decoded}/${total} (${failed} failed).`)
    const types = Object.keys(ibcTypes)
    console.log(`\n😼 ${types.length} IBC type(s):\n `, types.join(', '))
    console.log(`\n😼 ${typeUrls.size} type URL(s):\n `, [...typeUrls].join(', '))
    console.log()
  },
  'decode-success': (event) => {
    const {detail} = event as IBCDecodeSuccessEvent
    const {txHash, sectionIndex, length, ibc} = detail
    console.log()
    console.log('🟢 IBC #:  ', reader.total)
    console.log('🟢 TX ID:  ', txHash)
    console.log('🟢 Section:', sectionIndex)
    console.log('🟢 Bytes:  ',   length)
    console.log('🟢 Data:\n'+JSON.stringify(ibc, IBCReader.serializer, 2))
  },
  'decode-failure': (event) => {
    const {detail} = event as IBCDecodeFailureEvent
    const {txHash, sectionIndex, length, error} = detail
    console.log()
    console.log('🔴 IBC #:  ', reader.total)
    console.log('🔴 TX ID:  ', txHash)
    console.log('🔴 Section:', sectionIndex)
    console.log('🔴 Bytes:  ', length)
    console.log('🔴', error)
  }
})

await runWithConnectionPool(reader.onPool)
console.log('Errors encountered:')
for (const error of reader.errors) console.log(' ', error)
