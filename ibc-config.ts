/** PostgreSQL connection URL. */
export const IBC_DECODER_DB = Deno.env.get("IBC_DECODER_DB") || 'localhost:5432'

/** Version identifier for this service.
  * This is stored in the database alongside the decoded data. */
export const IBC_DECODER_VERSION = Deno.env.get('IBC_DECODER_VERSION') || 'v1'

/** Milliseconds to wait on completion before checking for new IBC transactions. */
export const IBC_DECODER_DELAY = Number(Deno.env.get('IBC_DECODER_DELAY')) || 5000

console.log('Decoder version identifier:', IBC_DECODER_VERSION)
