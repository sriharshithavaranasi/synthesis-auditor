import { copyFileSync, readdirSync, mkdirSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, '../..')

copyFileSync(
  join(root, 'results/results.json'),
  join(__dirname, '../public/results.json')
)

const publicTranscripts = join(__dirname, '../public/transcripts')
mkdirSync(publicTranscripts, { recursive: true })

for (const file of readdirSync(join(root, 'data/transcripts'))) {
  if (file.endsWith('.json')) {
    copyFileSync(
      join(root, 'data/transcripts', file),
      join(publicTranscripts, file)
    )
  }
}

console.log('Data copied to public/')
