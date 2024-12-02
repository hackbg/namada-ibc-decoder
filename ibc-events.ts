// deno-lint-ignore-file no-explicit-any

import { encodeBase64 } from './deps.ts'

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
  txHash:       string,
  sectionIndex: string,
  length:       number
}

export interface IBCDecodeSuccessData<T extends IBCCounterData> extends IBCDecodeData<T> {
  ibc: DecodedIBC
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
  report () {
    const {total, decoded, failed, ibcTypes, typeUrls} = this.detail
    console.log()
    console.log(`\n😼 Decoded ${decoded}/${total} (${failed} failed).`)
    const types = Object.keys(ibcTypes)
    console.log(`\n😼 ${types.length} IBC type(s):\n `, types.join(', '))
    console.log(`\n😼 ${typeUrls.size} type URL(s):\n `, [...typeUrls].join(', '))
    console.log()
  }
}

export class IBCDecodeSuccess<T extends IBCCounterData> extends CustomEvent<IBCDecodeSuccessData<T>> {
  constructor (detail: IBCDecodeSuccessData<T>) {
    super('decode-success', { detail })
  }
  report (full: boolean = false) {
    const {context, txHash, sectionIndex, length, ibc} = this.detail
    console.log()
    console.log('🟢 IBC #:  ', context.total)
    console.log('🟢 TX ID:  ', txHash)
    console.log('🟢 Section:', sectionIndex)
    console.log('🟢 Bytes:  ', length)
    if (full) {
      console.log('🟢 Data:\n' + JSON.stringify(ibc, ibcSerializer, 2))
    } else {
      console.log('🟢 Type:   ', ibc.type)
    }
  }
}

export class IBCDecodeFailure<T extends IBCCounterData> extends CustomEvent<IBCDecodeFailureData<T>> {
  constructor (detail: IBCDecodeFailureData<T>) {
    super('decode-failure', { detail })
  }
  report () {
    const {context, txHash, sectionIndex, length, error} = this.detail
    console.log()
    console.log('🔴 IBC #:  ', context.total)
    console.log('🔴 TX ID:  ', txHash)
    console.log('🔴 Section:', sectionIndex)
    console.log('🔴 Bytes:  ', length)
    console.log('🔴', error)
  }
}

export interface IBCEventHandlers {
  'decode-progress'?: (event: IBCDecodeProgress)=>unknown
  'decode-success'?: (event: IBCDecodeSuccess<any>)=>unknown
  'decode-failure'?: (event: IBCDecodeFailure<any>)=>unknown
}
