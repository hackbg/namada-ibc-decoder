import type { IBCCounterData, IBCEventHandlers } from './ibc-events.ts'

/** Keeps count of decoded IBC transactions. */
export class IBCCounter implements IBCCounterData {
  events  = new EventTarget()
  total   = 0
  decoded = 0
  failed  = 0
  ibcTypes: Record<string, number> = {}
  typeUrls: Set<string> = new Set()
  errors: Array<[string, unknown]> = []
  trackIbcDecodeBegin () {
    this.total++
  }
  trackIbcDecodeSuccess (type: string, typeUrl?: string) {
    this.ibcTypes[type] ??= 0
    this.ibcTypes[type]++
    if (typeUrl) {
      this.typeUrls.add(typeUrl)
    }
    this.decoded++
  }
  trackIbcDecodeFailure (prefix: string, error: unknown) {
    this.errors.push([prefix, error])
    this.failed++
  }
  bindEvents (events: IBCEventHandlers = {}) {
    for (const [event, handler] of Object.entries(events)) {
      this.events.addEventListener(event, handler as (event: Event)=>unknown)
    }
  }
}
