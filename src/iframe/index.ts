import './utils/dispose.ts'

// to-do: this is yoinking in the whole package.json. trim to just a version with env.
import pkg from '../../package.json' with {type: 'json'}
import {Engine} from './game/engine.ts'

console.log(`${pkg.name} v${pkg.version}`)

const game = new Engine()
await game.start()
