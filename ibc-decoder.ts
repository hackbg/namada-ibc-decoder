import { IBCCounter } from './ibc-counter.ts'
import { IBCDecodeProgress, IBCDecodeSuccess, IBCDecodeFailure } from './ibc-events.ts'
import type { DecodedIBC } from './ibc-events.ts'
import initDecoder, { Decode } from './pkg/namada_ibc_decoder.js'
import { decodeHex } from './deps.ts'

interface DecoderWASM {decode_ibc: (bin: Uint8Array)=>object}

/** Decodes IBC transactions using the WASM module. */
export class IBCDecoder extends IBCCounter {

  decodeTx (tx: TX) {
    let next_is_ibc = false
    for (const sectionIndex in tx.data.txsections) {
      const section = tx.data.txsections[sectionIndex]
      if (next_is_ibc && (section.type === 'Data')) {
        this.decodeIbc(tx.data.blockHeight, tx.data.txHash, sectionIndex, decodeHex(section.data))
      }
      next_is_ibc = (section.type === 'Code') && (section.tag === 'tx_ibc.wasm')
    }
  }

  decodeIbc (blockHeight: number, txHash: string, sectionIndex: string, binary: Uint8Array) {
    const ibcIndex = this.countIbcDecodeBegin()
    try {
      const decoded = Decode.ibc(binary) as DecodedIBC
      this.countIbcDecodeSuccess(decoded.type, decoded?.clientMessage?.typeUrl)
      this.events.dispatchEvent(new IBCDecodeSuccess({
        context: this,
        ibcIndex,
        blockHeight,
        txHash,
        sectionIndex,
        binary,
        decoded,
      }))
    } catch (e: unknown) {
      const error = e as { message: string }
      this.countIbcDecodeFailure(this.logPrefix(txHash, sectionIndex, binary.length), error)
      this.events.dispatchEvent(new IBCDecodeFailure({
        context: this,
        ibcIndex,
        blockHeight,
        txHash,
        sectionIndex,
        binary,
        error
      }))
    }
    this.events.dispatchEvent(new IBCDecodeProgress({...this}))
  }

  logPrefix = (txHash: string, sectionIndex: string, length: number) =>
    `IBC#${this.total}: TX: ${txHash} Section: ${sectionIndex}: ${length}b:`

  /** Handle to the WASM decoder. */
  static decoder: DecoderWASM

  /** Load the WASM decoder if not loaded. */
  static initDecoder (): Promise<DecoderWASM> {
    if (this.decoder) {
      return Promise.resolve(this.decoder)
    } else {
      // deno-lint-ignore no-async-promise-executor
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

export interface TX { data: { blockHeight: number, txHash: string, txsections: Array<TXSection> } }

export interface TXSection { type: string, tag: string, data: string, }
