import {expect, test} from 'vitest'
import {Cam} from '../renderer/cam.js'
import {Input} from './input.js'
import type {DefaultButton} from './input.js'

const cam: Cam = new Cam()
const canvas: HTMLCanvasElement = <HTMLCanvasElement>(<unknown>{
  addEventListener() {},
  removeEventListener() {},
  requestPointerLock() {},
  parentElement: {clientWidth: 0, clientHeight: 0},
})
globalThis.isSecureContext = true
Object.defineProperty(globalThis, 'navigator', {value: {getGamepads: () => []}})
const target: EventTarget = new EventTarget()
globalThis.addEventListener = (
  type: string,
  callback: EventListenerOrEventListenerObject | null,
  opts?: AddEventListenerOptions | boolean,
) =>
  target.addEventListener(
    type,
    ev =>
      (callback as (ev: object) => void)({
        type: ev.type,
        isTrusted: true,
        key: (ev as KeyboardEvent).key,
      }),
    opts,
  )

globalThis.removeEventListener = target.removeEventListener.bind(target)
globalThis.dispatchEvent = target.dispatchEvent.bind(target)

test('buttons are initially inactive', () => {
  const input = new Input(cam, canvas)
  input.mapDefault()
  input.register('add')
  expect(input.isOn('U')).toBe(false)
  expect(input.isOnStart('U')).toBe(false)
  expect(input.isHeld()).toBe(false)
  expect(input.isOffStart('U')).toBe(false)
  expect(input.isCombo(['U'])).toBe(false)
  expect(input.isComboStart(['U'])).toBe(false)
  input.register('remove')
})

test('pressed buttons are active and triggered', () => {
  const input = new Input(cam, canvas)
  input.mapDefault()
  input.register('add')
  dispatchKeyEvent('keydown', 'ArrowUp')
  input.poll(16)
  expect(input.isOn('U')).toBe(true)
  expect(input.isOnStart('U')).toBe(true)
  expect(input.isHeld()).toBe(false)
  expect(input.isOffStart('U')).toBe(false)
  expect(input.isCombo(['U'])).toBe(true)
  expect(input.isComboStart(['U'])).toBe(true)
  input.register('remove')
})

test('buttons are triggered for one frame only', () => {
  const input = new Input(cam, canvas)
  input.mapDefault()
  input.register('add')
  dispatchKeyEvent('keydown', 'ArrowUp')
  input.poll(16)
  expect(input.isOn('U')).toBe(true)
  expect(input.isOnStart('U')).toBe(true)
  expect(input.isHeld()).toBe(false)
  expect(input.isOffStart('U')).toBe(false)
  expect(input.isCombo(['U'])).toBe(true)
  expect(input.isComboStart(['U'])).toBe(true)
  input.poll(16)
  expect(input.isOn('U')).toBe(true)
  expect(input.isOnStart('U')).toBe(false)
  expect(input.isHeld()).toBe(false)
  expect(input.isOffStart('U')).toBe(false)
  expect(input.isCombo(['U'])).toBe(true)
  expect(input.isComboStart(['U'])).toBe(false)
  input.register('remove')
})

test('held buttons are active but not triggered', () => {
  const input = new Input(cam, canvas)
  input.mapDefault()
  input.register('add')
  dispatchKeyEvent('keydown', 'ArrowUp')
  input.poll(300)
  input.poll(16)
  expect(input.isOn('U')).toBe(true)
  expect(input.isOnStart('U')).toBe(false)
  expect(input.isHeld()).toBe(true)
  expect(input.isOffStart('U')).toBe(false)
  expect(input.isCombo(['U'])).toBe(true)
  expect(input.isComboStart(['U'])).toBe(false)
  input.register('remove')
})

test('released buttons are off and triggered', () => {
  const input = new Input(cam, canvas)
  input.mapDefault()
  input.register('add')
  dispatchKeyEvent('keydown', 'ArrowUp')
  input.poll(16)

  dispatchKeyEvent('keyup', 'ArrowUp')
  input.poll(16)

  expect(input.isOn('U')).toBe(false)
  expect(input.isOnStart('U')).toBe(false)
  expect(input.isHeld()).toBe(false)
  expect(input.isOffStart('U')).toBe(true)
  expect(input.isCombo(['U'])).toBe(false)
  expect(input.isComboStart(['U'])).toBe(false)

  input.register('remove')
})

test('combos are exact in length', () => {
  const input = new Input(cam, canvas)
  input.mapDefault()
  input.register('add')

  dispatchKeyEvent('keydown', 'ArrowUp')
  input.poll(16)
  expect(input.isCombo(['U'])).toBe(true)
  dispatchKeyEvent('keyup', 'ArrowUp')
  input.poll(16)

  dispatchKeyEvent('keydown', 'ArrowDown')
  input.poll(16)
  expect(input.isCombo(['U'])).toBe(false)
  expect(input.isCombo(['D'])).toBe(false)
  expect(input.isCombo(['U'], ['D'])).toBe(true)
  dispatchKeyEvent('keyup', 'ArrowDown')

  dispatchKeyEvent('keydown', 'ArrowRight')
  input.poll(16)
  expect(input.isCombo(['U'])).toBe(false)
  expect(input.isCombo(['D'])).toBe(false)
  expect(input.isCombo(['R'])).toBe(false)
  expect(input.isCombo(['D'], ['R'])).toBe(false)
  expect(input.isCombo(['U'], ['D'], ['R'])).toBe(true)
  dispatchKeyEvent('keyup', 'ArrowRight')
  input.poll(16)

  input.register('remove')
})

test('simultaneously pressed buttons are active and triggered', () => {
  const input = new Input(cam, canvas)
  input.mapDefault()
  input.register('add')
  dispatchKeyEvent('keydown', 'ArrowUp')
  dispatchKeyEvent('keydown', 'ArrowDown')
  input.poll(16)

  expect(input.isOn('U', 'D')).toBe(true)
  expect(input.isOnStart('U', 'D')).toBe(true)
  expect(input.isHeld()).toBe(false)
  expect(input.isOffStart('U', 'D')).toBe(false)
  expect(input.isCombo(['U'])).toBe(false)
  expect(input.isComboStart(['U'])).toBe(false)
  expect(input.isCombo(['D'])).toBe(false)
  expect(input.isComboStart(['D'])).toBe(false)
  expect(input.isCombo(['U', 'D'])).toBe(true)
  expect(input.isComboStart(['U', 'D'])).toBe(true)

  input.register('remove')
})

test('combos buttons are exact', () => {
  const input = new Input(cam, canvas)
  input.mapDefault()
  input.register('add')

  dispatchKeyEvent('keydown', 'ArrowUp')
  input.poll(16)
  expect(input.isCombo(['U'])).toBe(true)
  dispatchKeyEvent('keyup', 'ArrowUp')

  dispatchKeyEvent('keydown', 'ArrowDown')
  dispatchKeyEvent('keydown', 'ArrowLeft')
  input.poll(16)
  expect(input.isCombo(['U'])).toBe(false)
  expect(input.isCombo(['D'])).toBe(false)
  expect(input.isCombo(['U'], ['D'])).toBe(false)
  dispatchKeyEvent('keyup', 'ArrowDown')
  dispatchKeyEvent('keyup', 'ArrowLeft')

  dispatchKeyEvent('keydown', 'ArrowRight')
  input.poll(16)
  expect(input.isCombo(['U'])).toBe(false)
  expect(input.isCombo(['D'])).toBe(false)
  expect(input.isCombo(['R'])).toBe(false)
  expect(input.isCombo(['D'], ['R'])).toBe(false)
  expect(input.isCombo(['U'], ['D'], ['R'])).toBe(false)
  dispatchKeyEvent('keyup', 'ArrowRight')
  input.poll(16)

  input.register('remove')
})

test('a long combo is active and triggered', () => {
  const input = new Input(cam, canvas)
  input.mapDefault()
  input.register('add')

  const keys = [
    'ArrowUp',
    'ArrowUp',
    'ArrowDown',
    'ArrowDown',
    'ArrowLeft',
    'ArrowRight',
    'ArrowLeft',
    'ArrowRight',
  ]
  for (const [i, key] of keys.entries()) {
    dispatchKeyEvent('keydown', key)
    input.poll(16)
    if (i === keys.length - 1) break

    dispatchKeyEvent('keyup', key)
    input.poll(16)
  }

  const combo = keys.map(key => [
    <DefaultButton>key.replace(/Arrow(.).+/, '$1'),
  ])
  expect(input.isCombo(...combo)).toBe(true)
  expect(input.isComboStart(...combo)).toBe(true)
  expect(input.isHeld()).toBe(false)

  input.register('remove')
})

test('around-the-world combo is active and triggered', () => {
  const input = new Input(cam, canvas)
  input.mapDefault()
  input.register('add')

  const keyCombo = [
    ['ArrowUp'],
    ['ArrowUp', 'ArrowLeft'],
    ['ArrowLeft'],
    ['ArrowLeft', 'ArrowDown'],
    ['ArrowDown'],
    ['ArrowDown', 'ArrowRight'],
    ['ArrowRight'],
    ['ArrowUp', 'ArrowRight'],
  ]
  for (const [i, buttons] of keyCombo.entries()) {
    for (const button of buttons) {
      dispatchKeyEvent('keydown', button)
    }
    input.poll(16)
    if (i === keyCombo.length - 1) break

    for (const button of buttons) {
      dispatchKeyEvent('keyup', button)
    }
    input.poll(16)
  }

  const combo = keyCombo.map(keys =>
    keys.map(key => <DefaultButton>key.replace(/Arrow(.).+/, '$1')),
  )
  expect(input.isCombo(...combo)).toBe(true)
  expect(input.isComboStart(...combo)).toBe(true)
  expect(input.isHeld()).toBe(false)

  input.register('remove')
})

test('combo expired', () => {
  const input = new Input(cam, canvas)
  input.mapDefault()
  input.register('add')

  dispatchKeyEvent('keydown', 'ArrowUp')
  input.poll(16)
  expect(input.isCombo(['U'])).toBe(true)
  dispatchKeyEvent('keyup', 'ArrowUp')

  dispatchKeyEvent('keydown', 'ArrowDown')
  input.poll(16)
  expect(input.isCombo(['U'])).toBe(false)
  expect(input.isCombo(['D'])).toBe(false)
  expect(input.isCombo(['U'], ['D'])).toBe(true)
  dispatchKeyEvent('keyup', 'ArrowDown')
  input.poll(1000)

  dispatchKeyEvent('keydown', 'ArrowRight')
  input.poll(16)
  expect(input.isCombo(['U'])).toBe(false)
  expect(input.isCombo(['D'])).toBe(false)
  expect(input.isCombo(['R'])).toBe(false)
  expect(input.isCombo(['D'], ['R'])).toBe(false)
  expect(input.isCombo(['U'], ['D'], ['R'])).toBe(false)
  dispatchKeyEvent('keyup', 'ArrowRight')
  input.poll(16)

  input.register('remove')
})

test('long-pressed combo is active and held', () => {
  const input = new Input(cam, canvas)
  input.mapDefault()
  input.register('add')

  dispatchKeyEvent('keydown', 'ArrowUp')
  input.poll(16)
  expect(input.isCombo(['U'])).toBe(true)
  dispatchKeyEvent('keyup', 'ArrowUp')

  dispatchKeyEvent('keydown', 'ArrowDown')
  input.poll(16)
  expect(input.isCombo(['U'])).toBe(false)
  expect(input.isCombo(['D'])).toBe(false)
  expect(input.isCombo(['U'], ['D'])).toBe(true)
  dispatchKeyEvent('keyup', 'ArrowDown')

  dispatchKeyEvent('keydown', 'ArrowRight')
  input.poll(16)
  expect(input.isCombo(['U'])).toBe(false)
  expect(input.isCombo(['D'])).toBe(false)
  expect(input.isCombo(['R'])).toBe(false)
  expect(input.isCombo(['D'], ['R'])).toBe(false)
  expect(input.isCombo(['U'], ['D'], ['R'])).toBe(true)
  input.poll(1000)
  input.poll(16)

  expect(input.isCombo(['U'], ['D'], ['R'])).toBe(true)
  expect(input.isHeld()).toBe(true)

  input.register('remove')
})

test('combo after long-pressed combo is active', () => {
  const input = new Input(cam, canvas)
  input.mapDefault()
  input.register('add')

  dispatchKeyEvent('keydown', 'ArrowUp')
  input.poll(16)
  expect(input.isCombo(['U'])).toBe(true)
  dispatchKeyEvent('keyup', 'ArrowUp')

  dispatchKeyEvent('keydown', 'ArrowDown')
  input.poll(16)
  expect(input.isCombo(['U'])).toBe(false)
  expect(input.isCombo(['D'])).toBe(false)
  expect(input.isCombo(['U'], ['D'])).toBe(true)
  dispatchKeyEvent('keyup', 'ArrowDown')

  dispatchKeyEvent('keydown', 'ArrowRight')
  input.poll(16)
  expect(input.isCombo(['U'])).toBe(false)
  expect(input.isCombo(['D'])).toBe(false)
  expect(input.isCombo(['R'])).toBe(false)
  expect(input.isCombo(['D'], ['R'])).toBe(false)
  expect(input.isCombo(['U'], ['D'], ['R'])).toBe(true)
  input.poll(1000)
  dispatchKeyEvent('keyup', 'ArrowRight')

  input.poll(16)

  dispatchKeyEvent('keydown', 'ArrowLeft')
  input.poll(16)
  dispatchKeyEvent('keyup', 'ArrowLeft')

  dispatchKeyEvent('keydown', 'ArrowDown')
  input.poll(16)
  dispatchKeyEvent('keyup', 'ArrowDown')

  dispatchKeyEvent('keydown', 'ArrowUp')
  input.poll(16)

  expect(input.isCombo(['L'], ['D'], ['U'])).toBe(true)

  input.register('remove')
})

function dispatchKeyEvent(type: 'keydown' | 'keyup', key: string): void {
  dispatchEvent(Object.assign(new Event(type), {key}))
}
