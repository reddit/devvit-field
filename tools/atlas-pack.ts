#!/usr/bin/env -S node --experimental-strip-types --no-warnings=ExperimentalWarning
// Compiles images into an atlas.
//
// atlas-pack.ts config.json

import {execFileSync} from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import type {Config} from '../src/iframe/types/config.js'
import {parseAtlas} from './atlas-parser.ts'

const configFilename = process.argv
  .slice(2)
  .filter(arg => !arg.startsWith('--'))[0]
if (!configFilename) throw Error('no game config')
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
const json = execFileSync(
  'aseprite',
  [
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
  ],
  {encoding: 'utf8'},
)

const atlas = parseAtlas(JSON.parse(json), config.tags)
fs.writeFileSync(atlasJSONFilename, JSON.stringify(atlas, undefined, 2))
