#!/usr/bin/env -S node --experimental-strip-types --no-warnings=ExperimentalWarning
// Compiles images into an atlas.
//
// atlas-pack.ts config.json

import {type ExecFileException, execFile} from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import type {Config} from '../src/shared/types/config.js'
import {parseAtlas} from './atlas-parser.ts'

const configFilename = process.argv
  .slice(2)
  .filter(arg => !arg.startsWith('--'))[0]
if (!configFilename) throw Error('no config')
// Validation is by `satisfies Config`.
const config: Config = JSON.parse(fs.readFileSync(configFilename, 'utf8'))
const configDir = path.dirname(configFilename)

const atlasImageFilename = path.resolve(configDir, config.atlasImage)
const atlasJSONFilename = path.resolve(configDir, config.atlasJSON)
const aseDirname = path.resolve(configDir, config.aseDir)
const aseFilenames = fs
  .readdirSync(aseDirname)
  .filter(name => name.endsWith('.aseprite'))
  .map(name => path.resolve(aseDirname, name))
const json = await ase(
  '--batch',
  // '--color-mode=indexed',
  '--filename-format={title}--{tag}--{frame}',
  '--list-slices',
  '--list-tags',
  '--merge-duplicates',
  `--sheet=${atlasImageFilename}`,
  '--sheet-pack',
  '--tagname-format={title}--{tag}',
  ...aseFilenames,
)

const atlas = parseAtlas(JSON.parse(json), config.tags)
fs.writeFileSync(atlasJSONFilename, JSON.stringify(atlas, undefined, 2))

async function ase(...args: readonly string[]): Promise<string> {
  const [err, stdout, stderr] = await new Promise<
    [ExecFileException | null, string, string]
  >(resolve =>
    execFile('aseprite', args, (err, stdout, stderr) =>
      resolve([err, stdout, stderr]),
    ),
  )
  process.stderr.write(stderr)
  if (err) throw err
  return stdout
}
