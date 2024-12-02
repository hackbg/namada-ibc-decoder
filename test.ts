#!/usr/bin/env -S deno run --allow-env --allow-net --allow-read=.env,pkg
import { StreamingIBCDecoder } from './main.ts'
const decoder = new StreamingIBCDecoder()
console.log(decoder.version)
await decoder.run()
console.log(decoder.stats)
