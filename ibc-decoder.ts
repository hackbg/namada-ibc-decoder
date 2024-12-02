import { encodeHex } from './deps.ts'
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
    this.events.dispatchEvent(new IBCDecodeProgressEvent({...this}))
  }

  ibcDecodeSuccess (txHash: string, sectionIndex: string, length: number, ibc: DecodedIBC) {
    //const prefix = this.logPrefix(txHash, sectionIndex, length)
    this.trackIbcDecodeSuccess(ibc.type, ibc?.clientMessage?.typeUrl)
    //console.log('🟢', prefix, JSON.stringify(ibc, IBCDecoder.serializer, 2))
    this.events.dispatchEvent(new IBCDecodeSuccessEvent({ txHash, sectionIndex, length, ibc, }))
  }

  ibcDecodeFailure (txHash: string, sectionIndex: string, length: number, err: {message: string}) {
    this.trackIbcDecodeFailure(this.logPrefix(txHash, sectionIndex, length), err)
    //console.error('🔴', err)
    //console.error('🔴', `${prefix} decode failed ${err.message}`)
    this.events.dispatchEvent(new IBCDecodeFailureEvent({ txHash, sectionIndex, length, error: err }))
  }

  logPrefix = (txHash: string, sectionIndex: string, length: number) =>
    `IBC#${this.total}: TX: ${txHash} Section: ${sectionIndex}: ${length}b:`

  static serializer (_: unknown, value: unknown) {
    if (value instanceof Uint8Array) return encodeHex(value)
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

interface DecoderWASM { decode_ibc: (bin: Uint8Array)=>object }

interface DecodedIBC { type: string, clientMessage?: { typeUrl?: string }, [k: string]: unknown }

interface IBCDecodeEventData { txHash: string, sectionIndex: string, length: number }

interface IBCDecodeSuccessEventData extends IBCDecodeEventData { ibc: DecodedIBC }

interface IBCDecodeFailureEventData extends IBCDecodeEventData { error: { message: string } }

export class IBCDecodeProgressEvent extends CustomEvent<IBCCounterData> {
  constructor (detail: IBCCounterData) {
    super('decode-progress', { detail })
  }
}

export class IBCDecodeSuccessEvent extends CustomEvent<IBCDecodeSuccessEventData> {
  constructor (detail: IBCDecodeSuccessEventData) {
    super('decode-success', { detail })
  }
}

export class IBCDecodeFailureEvent extends CustomEvent<IBCDecodeFailureEventData> {
  constructor (detail: IBCDecodeFailureEventData) {
    super('decode-failure', { detail })
  }
}
