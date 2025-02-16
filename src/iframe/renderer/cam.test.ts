import {expect, test} from 'vitest'
import {Cam} from './cam.js'

test('Cam', () => {
  const canvas = {
    parentElement: {
      clientWidth: 162.1999969482422,
      clientHeight: 88.80000305175781,
    },
  } as HTMLCanvasElement
  globalThis.devicePixelRatio = 5
  const cam = new Cam()
  cam.minWH.w = 400
  cam.minWH.h = 128
  cam.mode = 'Int'
  cam.resize(canvas)

  expect(cam.scale).toBe(2)
  expect(cam.w).toBe(406)
  expect(cam.h).toBe(223)

  expect(
    cam.toLevelXY(canvas, {x: 137.40000915527344, y: 48.400001525878906}),
  ).toStrictEqual({x: 343.9235805586467, y: 121.54504469983058})
})
