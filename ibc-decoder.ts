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

  decodeIbc (blockHeight: number, txHash: string, sectionIndex: string, bin: Uint8Array) {
    this.trackIbcDecodeBegin()
    try {
      const decoded = Decode.ibc(bin) as DecodedIBC
      this.ibcDecodeSuccess(blockHeight, txHash, sectionIndex, bin.length, decoded)
    } catch (e: unknown) {
      const error = e as { message: string }
      this.ibcDecodeFailure(blockHeight, txHash, sectionIndex, bin.length, error)
    }
    this.events.dispatchEvent(new IBCDecodeProgress({...this}))
  }

  ibcDecodeSuccess (blockHeight: number, txHash: string, sectionIndex: string, length: number, ibc: DecodedIBC) {
    this.trackIbcDecodeSuccess(ibc.type, ibc?.clientMessage?.typeUrl)
    this.events.dispatchEvent(new IBCDecodeSuccess({
      context: this,
      blockHeight,
      txHash,
      sectionIndex,
      length,
      ibc,
    }))
  }

  ibcDecodeFailure (blockHeight: number, txHash: string, sectionIndex: string, length: number, err: {message: string}) {
    this.trackIbcDecodeFailure(this.logPrefix(txHash, sectionIndex, length), err)
    this.events.dispatchEvent(new IBCDecodeFailure({
      context: this,
      blockHeight,
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

export interface TX { data: { blockHeight: number, txHash: string, txsections: Array<TXSection> } }

export interface TXSection { type: string, tag: string, data: string, }
