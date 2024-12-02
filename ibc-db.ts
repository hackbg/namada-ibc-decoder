import { createPool, createPgDriverFactory } from './deps.ts'
import type { DatabasePool } from './deps.ts'
import * as Config from './ibc-config.ts'

/** Open a PostgreSQL connection pool with `slonik` and pass it to a callback.
  * When the callback is done executing, close the connection pool. */
export async function runWithConnectionPoolUntilEnd <T> (callback: (pool: DatabasePool)=>T|Promise<T>) {
  const { pool, result } = await runWithConnectionPool(callback)
  await pool.end()
  return result
}

/** Open a PostgreSQL connection pool with `slonik` and pass it to a callback. */
export async function runWithConnectionPool <T> (callback: (pool: DatabasePool)=>T|Promise<T>) {
  const url = Config.IBC_DECODER_DB
  const driverFactory = createPgDriverFactory()
  const statementTimeout = 'DISABLE_TIMEOUT'
  const pool = await createPool(url, { driverFactory, statementTimeout })
  pool.on('error', (error: unknown) => { console.error(error); Deno.exit(1) })
  return {
    pool,
    result: callback(pool)
  }
}
