#!/usr/bin/env -S deno run --allow-env --allow-net --allow-read=.env,pkg
import { runWithConnectionPool } from './ibc-db.ts'
import { IBCReader } from './ibc-reader.ts'
await IBCReader.initDecoder()
const reader = new IBCReader()
await runWithConnectionPool(reader.onPool)
