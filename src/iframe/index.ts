import './utils/dispose.ts'
import './utils/crypto.ts'

import {Engine} from './game/engine.ts'

console.log(`Banfield v${version}`)

const game = new Engine()
await game.start()
