import { encodeBase64 } from './deps.ts'
import { IBCCounter } from './ibc-counter.ts'
import type { IBCCounterData } from './ibc-counter.ts'
import initDecoder, { Decode } from './pkg/namada_ibc_decoder.js'

/** Decodes IBC transactions using the WASM module. */
export class IBCDecoder extends IBCCounter {

  decodeIbc (bin: Uint8Array, txHash: string, sectionIndex: string) {
    this.trackIbcDecodeBegin()
    try {
      this.ibcDecodeSuccess(txHash, sectionIndex, bin.length, Decode.ibc(bin) as DecodedIBC)
    } catch (e: unknown) {
      this.ibcDecodeFailure(txHash, sectionIndex, bin.length, e as { message: string })
    }
    this.events.dispatchEvent(new IBCDecodeProgress({...this}))
  }

  ibcDecodeSuccess (txHash: string, sectionIndex: string, length: number, ibc: DecodedIBC) {
    this.trackIbcDecodeSuccess(ibc.type, ibc?.clientMessage?.typeUrl)
    this.events.dispatchEvent(new IBCDecodeSuccess({
      context: this,
      txHash,
      sectionIndex,
      length,
      ibc,
    }))
  }

  ibcDecodeFailure (txHash: string, sectionIndex: string, length: number, err: {message: string}) {
    this.trackIbcDecodeFailure(this.logPrefix(txHash, sectionIndex, length), err)
    this.events.dispatchEvent(new IBCDecodeFailure({
      context: this,
      txHash,
      sectionIndex,
      length,
      error: err
    }))
  }

  logPrefix = (txHash: string, sectionIndex: string, length: number) =>
    `IBC#${this.total}: TX: ${txHash} Section: ${sectionIndex}: ${length}b:`

  static serializer (_: unknown, value: unknown) {
    if (value instanceof Uint8Array) return encodeBase64(value)
    if (typeof value === 'bigint') return String(value)
    return value
  }

  /** SemVer-compatible (actually TrunkVer) version identifier for this service.
    * This is stored in the database alongside the decoded data. */
  static version = Deno.env.get('IBC_DECODER_VERSION') || '0'

  /** Handle to the WASM decoder. */
  static decoder: DecoderWASM

  /** Load the WASM decoder if not loaded. */
  static initDecoder (): Promise<DecoderWASM> {
    if (this.decoder) {
      return Promise.resolve(this.decoder)
    } else {
      return new Promise(async(resolve, reject)=>{
        try {
          const wasm = await Deno.readFile('./pkg/namada_ibc_decoder_bg.wasm')
          this.decoder = await initDecoder({ module_or_path: wasm })
          resolve(this.decoder)
        } catch (e) {
          reject(e)
        }
      })
    }
  }

}

interface DecoderWASM {decode_ibc: (bin: Uint8Array)=>object}

interface DecodedIBC {type: string, clientMessage?: { typeUrl?: string }, [k: string]: unknown}

interface IBCDecodeData<T extends IBCCounter> {context: T, txHash: string, sectionIndex: string, length: number}

interface IBCDecodeSuccessData<T extends IBCCounter> extends IBCDecodeData<T> {ibc: DecodedIBC}

interface IBCDecodeFailureData<T extends IBCCounter> extends IBCDecodeData<T> {error: { message: string }}

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

export class IBCDecodeSuccess<T extends IBCCounter> extends CustomEvent<IBCDecodeSuccessData<T>> {
  constructor (detail: IBCDecodeSuccessData<T>) {
    super('decode-success', { detail })
  }
  report () {
    const {context, txHash, sectionIndex, length, ibc} = this.detail
    console.log()
    console.log('🟢 IBC #:  ', context.total)
    console.log('🟢 TX ID:  ', txHash)
    console.log('🟢 Section:', sectionIndex)
    console.log('🟢 Bytes:  ', length)
    console.log('🟢 Data:\n' + JSON.stringify(ibc, IBCDecoder.serializer, 2))
  }
}

export class IBCDecodeFailure<T extends IBCCounter> extends CustomEvent<IBCDecodeFailureData<T>> {
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
