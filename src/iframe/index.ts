import './utils/dispose.ts'
import './utils/crypto.ts'

import {Game} from './game/game.ts'

console.log(`Banfield v${version}`)

const game = new Game()
await game.start()
