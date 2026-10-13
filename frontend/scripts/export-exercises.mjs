// Writes dist/exercises.json — the built-in exercise catalogue as plain JSON, so scripts and
// agents importing workouts through the API (docs/API.md) can map exercise names to ids
// without parsing the JS bundle. Run after `vite build`.
import fs from 'node:fs'
import { EXDB } from '../src/lib/exercises-data.js'

const slim = EXDB.map(({ id, n, bp, eq, tg }) => ({ id, name: n, bodyPart: bp, equipment: eq, target: tg }))
fs.writeFileSync(new URL('../dist/exercises.json', import.meta.url), JSON.stringify(slim))
console.log(`exercises.json: ${slim.length} exercises`)
