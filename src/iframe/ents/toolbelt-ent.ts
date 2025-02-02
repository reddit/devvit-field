// import type {spacePx} from '../../shared/theme.ts'
// import type {Box} from '../../shared/types/2d.ts'
// import type {Cam} from '../cam.ts'
// import type {Game} from '../game.ts'
// import type {Layer} from '../layer.ts'
// import type {ButtonEnt, buttonSize} from './button-ent.ts'
// import {cursorEntHits} from './cursor-ent.ts'
// import type {EID, EIDFactory} from './eid.ts'

// export type ToolbeltEnt = Box & {
//   readonly eid: EID
//   ents: {
//     rock: ButtonEnt
//     codex: ButtonEnt
//     score: ButtonEnt
//     shop: ButtonEnt
//     new: ButtonEnt
//     help: ButtonEnt
//   }
//   layer: Layer
//   readonly type: 'Toolbelt'
// }

// export function ToolbeltEnt(cam: Readonly<Cam>, eid: EIDFactory): ToolbeltEnt {
//   const belt: ToolbeltEnt = {
//     ents: {
//       codex: ButtonEnt(eid, 'codexButton', 'codex'),
//       new: ButtonEnt(eid, 'newButton', 'new'),
//       rock: ButtonEnt(eid, 'rockButton', 'rock'),
//       score: ButtonEnt(eid, 'scoreButton', 'score'),
//       shop: ButtonEnt(eid, 'shopButton', 'shop'),
//       help: ButtonEnt(eid, 'helpButton', 'help'),
//     },
//     eid: eid.new(),
//     layer: 'UIBackground',
//     type: 'Toolbelt',
//     x: 0,
//     y: 0,
//     w: 0,
//     h: 0,
//   }
//   updateBox(belt, cam)
//   return belt
// }

// export function toolbeltEntDraw(
//   belt: Readonly<ToolbeltEnt>,
//   game: Readonly<Game>,
// ): void {
//   const {c2d, draw} = game
//   c2d.beginPath()
//   c2d.roundRect(belt.x, belt.y, belt.w, belt.h, spacePx)
//   c2d.fillStyle = draw.bg
//   c2d.fill()
//   c2d.lineWidth = 1
//   c2d.strokeStyle = paletteBlack
//   c2d.stroke()
// }

// export function toolbeltEntUpdate(belt: ToolbeltEnt, game: Game): void {
//   const {cam, ctrl, zoo} = game
//   const {rock, codex, help, score, shop, new: newGame} = belt.ents
//   updateBox(belt, cam)

//   codex.img = game.codex.found == null ? 'codexButton' : 'codexMinButton'

//   if (rock.onStart && !rock.selected) {
//     zoo.replace(RockLevelEnt(game))
//     select(belt, 'rock')
//   } else if (codex.onStart && !codex.selected) {
//     zoo.replace(CodexLevelEnt(game))
//     select(belt, 'codex')
//   } else if (score.onStart && !score.selected) {
//     zoo.replace(ScoreboardLevelEnt(game))
//     select(belt, 'score')
//   } else if (shop.onStart && !shop.selected) {
//     zoo.replace(ShopLevelEnt(game))
//     select(belt, 'shop')
//   } else if (newGame.onStart && !newGame.selected) {
//     postMessage({type: 'NewGame', p1: game.p1})
//     select(belt, 'new')
//     newGame.disabled = true
//   } else if (help.onStart && !help.selected) {
//     zoo.replace(HelpLevelEnt(game))
//     select(belt, 'help')
//   }

//   ctrl.handled ||= cursorEntHits(game, belt, 'Client')
// }

// function select(belt: ToolbeltEnt, select: keyof ToolbeltEnt['ents']): void {
//   for (const ent of Object.values(belt.ents)) ent.selected = false
//   belt.ents[select].selected = true
// }

// function updateBox(belt: ToolbeltEnt, cam: Readonly<Cam>): void {
//   const {rock, codex, score, shop, new: newGame, help} = belt.ents
//   const short = buttonSize() + 2 * spacePx
//   const long = 6 * buttonSize() + 7 * spacePx
//   if (cam.portrait) {
//     belt.x = cam.w / 2 - long / 2
//     belt.y = cam.h - short - spacePx
//     belt.w = long
//     belt.h = short
//   } else {
//     belt.x = spacePx
//     belt.y = cam.h / 2 - long / 2
//     belt.w = short
//     belt.h = long
//   }

//   rock.x = belt.x + spacePx
//   rock.y = belt.y + spacePx

//   codex.x = rock.x + (cam.portrait ? rock.w + spacePx : 0)
//   codex.y = rock.y + (cam.portrait ? 0 : rock.h + spacePx)

//   score.x = codex.x + (cam.portrait ? codex.w + spacePx : 0)
//   score.y = codex.y + (cam.portrait ? 0 : codex.h + spacePx)

//   shop.x = score.x + (cam.portrait ? score.w + spacePx : 0)
//   shop.y = score.y + (cam.portrait ? 0 : score.h + spacePx)

//   newGame.x = shop.x + (cam.portrait ? shop.w + spacePx : 0)
//   newGame.y = shop.y + (cam.portrait ? 0 : shop.h + spacePx)

//   help.x = newGame.x + (cam.portrait ? newGame.w + spacePx : 0)
//   help.y = newGame.y + (cam.portrait ? 0 : newGame.h + spacePx)
// }
