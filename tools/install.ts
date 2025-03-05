#!/usr/bin/env -S node --experimental-strip-types --no-warnings=ExperimentalWarning
// Installs an app to all subs in config.
//
// install.ts src/devvit/server/core/config.dev.json

import {spawn} from 'node:child_process'
import fs from 'node:fs'
import type {BanFieldConfig} from '../src/shared/types/level.js'

const configFilename = process.argv
  .slice(2)
  .filter(arg => !arg.startsWith('--'))[0]
if (!configFilename) throw Error('no config')

const config: BanFieldConfig = JSON.parse(
  fs.readFileSync(configFilename, 'utf-8'),
)

// to-do: DXC-713 use JSON in package.json.
const app = fs.readFileSync(config.devvitConfig, 'utf-8')
const name = app.match(/^name:\s*(.+)$/m)?.[1]?.trim()
const version = app.match(/^version:\s*(.+)$/m)?.[1]?.trim()
if (!name || !version) throw Error('bad YAML')

await Promise.all([
  // Only install to r/GOR when in development. Prod is on a different version
  // for countdowns to prevent deploying code. to-do: make unconditional
  // post-launch.
  ...(configFilename.includes('.prod.')
    ? []
    : [
        spawnAsync('npx', [
          'devvit',
          'install',
          `--config=${config.devvitConfig}`,
          `r/${config.leaderboard.subredditName}`,
          `${name}@${version}`,
        ]),
      ]),
  config.levels.map(lvl =>
    spawnAsync('npx', [
      'devvit',
      'install',
      `--config=${config.devvitConfig}`,
      `r/${lvl.subredditName}`,
      // to-do: support @next.
      `${name}@${version}`,
    ]),
  ),
])

function spawnAsync(cmd: string, args: readonly string[]): Promise<void> {
  const child = spawn(cmd, args, {stdio: 'inherit'})
  return new Promise((fulfil, reject) => {
    child.on('error', err => reject(err))
    child.on('exit', code => {
      if (code) reject(Error(`exit ${code}`))
      else fulfil()
    })
  })
}
