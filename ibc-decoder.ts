import { IBCCounter } from './ibc-counter.ts'
import { IBCDecodeProgress, IBCDecodeSuccess, IBCDecodeFailure } from './ibc-events.ts'
import type { DecodedIBC } from './ibc-events.ts'
import initDecoder, { Decode } from './pkg/namada_ibc_decoder.js'

interface DecoderWASM {decode_ibc: (bin: Uint8Array)=>object}

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
