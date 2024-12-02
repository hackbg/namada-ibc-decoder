// deno-lint-ignore-file no-explicit-any

import { encodeBase64 } from './deps.ts'

export function ibcSerialize (data: object, indent?: number) {
  return JSON.stringify(data, ibcSerializer, indent)
}

export function ibcSerializer (_: unknown, value: unknown) {
  if (value instanceof Uint8Array) return encodeBase64(value)
  if (typeof value === 'bigint') return String(value)
  return value
}

export interface IBCCounterData {
  total:    number
  decoded:  number
  failed:   number
  ibcTypes: Record<string, number>
  typeUrls: Set<string>
  errors:   Array<[string, unknown]>
}

export interface IBCDecodeData<T extends IBCCounterData> {
  context:      T,
  ibcIndex:     number,
  blockHeight:  number,
  txHash:       string,
  sectionIndex: string,
  binary:       Uint8Array
}

export interface IBCDecodeSuccessData<T extends IBCCounterData> extends IBCDecodeData<T> {
  decoded: DecodedIBC
}

export interface DecodedIBC {
  type: string,
  clientMessage?: { typeUrl?: string },
  [k: string]: unknown
}

export interface IBCDecodeFailureData<T extends IBCCounterData> extends IBCDecodeData<T> {
  error: { message: string }
}

export class IBCDecodeProgress extends CustomEvent<IBCCounterData> {
  constructor (detail: IBCCounterData) {
    super('decode-progress', { detail })
  }
  report (verbose: boolean = false) {
    const {total, decoded, failed, ibcTypes, typeUrls} = this.detail
    if (verbose) {
      console.log()
      console.log(`\n😼 Decoded ${decoded}/${total} (${failed} failed).`)
      const types = Object.keys(ibcTypes)
      console.log(`\n😼 ${types.length} IBC type(s):\n `, types.join(', '))
      console.log(`\n😼 ${typeUrls.size} type URL(s):\n `, [...typeUrls].join(', '))
      console.log()
    } else {
      console.log(
        `😼 Decoded ${decoded}/${total} (${failed} failed);`,
        `IBC types: ${Object.keys(ibcTypes).length};`,
        `Type URLs: ${typeUrls.size}`,
      )
    }
  }
}

export class IBCDecodeSuccess<T extends IBCCounterData> extends CustomEvent<IBCDecodeSuccessData<T>> {
  constructor (detail: IBCDecodeSuccessData<T>) {
    super('decode-success', { detail })
  }
  report (verbose: boolean = false) {
    const {ibcIndex, blockHeight, txHash, sectionIndex, binary, decoded} = this.detail
    if (verbose) {
      console.log()
      console.log('🟢 IBC #:  ', ibcIndex)
      console.log('🟢 Block:  ', blockHeight)
      console.log('🟢 TX ID:  ', txHash)
      console.log('🟢 Section:', sectionIndex)
      console.log('🟢 Bytes:  ', binary.length)
      console.log('🟢 Data:\n' + JSON.stringify(decoded, ibcSerializer, 2))
    } else {
      console.log(
        '🟢 IBC #', ibcIndex,     'is',     decoded.type,
        'at',       blockHeight,  'tx',     txHash,
        '#',        sectionIndex, 'bytes:', binary.length
      )
    }
  }
}

export class IBCDecodeFailure<T extends IBCCounterData> extends CustomEvent<IBCDecodeFailureData<T>> {
  constructor (detail: IBCDecodeFailureData<T>) {
    super('decode-failure', { detail })
  }
  report () {
    const {ibcIndex, blockHeight, txHash, sectionIndex, binary, error} = this.detail
    console.log()
    console.log('🔴 IBC #:  ', ibcIndex)
    console.log('🔴 Block:  ', blockHeight)
    console.log('🔴 TX ID:  ', txHash)
    console.log('🔴 Section:', sectionIndex)
    console.log('🔴 Bytes:  ', binary.length)
    console.log('🔴', error)
  }
}

export interface IBCEventHandlers {
  'decode-progress'?: (event: IBCDecodeProgress)=>unknown
  'decode-success'?: (event: IBCDecodeSuccess<any>)=>unknown
  'decode-failure'?: (event: IBCDecodeFailure<any>)=>unknown
}
