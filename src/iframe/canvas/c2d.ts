import {fontFamily, paletteDark, paletteWhite} from '../../shared/theme.ts'
import type {Box, WH, XY} from '../../shared/types/2d.ts'
import type {Cam} from '../cam.ts'

export type C2D = CanvasRenderingContext2D

export function C2D(canvas: HTMLCanvasElement): C2D | undefined {
  return (
    canvas.getContext('2d', {alpha: false, willReadFrequently: false}) ??
    undefined
  )
}

export function c2dClear(c2d: C2D, cam: Readonly<Cam>): void {
  c2d.beginPath()
  c2d.fillStyle = paletteDark
  c2d.fillRect(cam.x, cam.y, cam.w, cam.h)

  const radius = 16

  c2d.beginPath()
  c2d.lineWidth = 4
  c2d.roundRect(
    c2d.lineWidth,
    c2d.lineWidth,
    cam.w - 2 * c2d.lineWidth,
    cam.h - 2 * c2d.lineWidth,
    radius,
  )
  c2d.strokeStyle = paletteDark
  c2d.stroke()

  c2d.fillStyle = paletteWhite
  c2d.fill()
}

export function c2dText(
  c2d: C2D,
  text: string,
  opts: Readonly<
    XY & {
      origin?:
        | 'Center'
        | 'BottomCenter'
        | 'BottomLeft'
        | 'BottomRight'
        | 'MidLeft'
        | 'MidRight'
        | 'TopLeft'
        | 'TopRight'
        | 'TopCenter' // to-do: align terminology with cam.
      fill?: string
      size: number
      stroke?: string
      strokeWidth?: number
      pad?: Partial<WH> | undefined
    }
  >,
): Box {
  if (opts.fill) c2d.fillStyle = opts.fill
  c2d.font = `${opts.size}px ${fontFamily}`
  if (opts.stroke) c2d.strokeStyle = opts.stroke
  c2d.lineWidth = opts.strokeWidth ?? 4
  c2d.beginPath()
  const metrics = c2d.measureText(text)
  let x = opts.x
  let y = opts.y
  const justify = opts.origin ?? 'TopLeft'
  const padW = opts?.pad?.w ?? 0
  const padH = opts?.pad?.h ?? 0
  switch (justify) {
    case 'BottomCenter':
      x -= Math.trunc(metrics.width / 2 + padW)
      y -= c2d.lineWidth + padH
      break
    case 'BottomLeft':
      x += c2d.lineWidth + padW
      y -= c2d.lineWidth + padH
      break
    case 'BottomRight':
      x -= metrics.width + c2d.lineWidth + padW
      y -= c2d.lineWidth + padH
      break
    case 'Center':
      x -= Math.trunc((metrics.width + c2d.lineWidth) / 2) + padW
      y += Math.trunc(metrics.actualBoundingBoxAscent / 2)
      break
    case 'MidLeft':
      x += padW
      y += Math.trunc(metrics.actualBoundingBoxAscent / 2)
      break
    case 'MidRight':
      x -= metrics.width + c2d.lineWidth + padW
      y += Math.trunc(metrics.actualBoundingBoxAscent / 2)
      break
    case 'TopLeft':
      x += padW
      y +=
        metrics.actualBoundingBoxAscent +
        metrics.actualBoundingBoxDescent +
        c2d.lineWidth +
        padH
      break
    case 'TopCenter':
      x -= Math.trunc((metrics.width + c2d.lineWidth) / 2) + padW
      y += metrics.actualBoundingBoxAscent + c2d.lineWidth + padH
      break
    case 'TopRight':
      x -= metrics.width + c2d.lineWidth + padW
      y +=
        metrics.actualBoundingBoxAscent +
        metrics.actualBoundingBoxDescent +
        c2d.lineWidth +
        padH
      break
    default:
      justify satisfies never
  }
  if (opts.stroke) c2d.strokeText(text, x, y)
  if (opts.fill) c2d.fillText(text, x, y)
  const h = metrics.actualBoundingBoxAscent + c2d.lineWidth * 2
  // to-do: decide what to do about not wanting descent generally.
  // to-do: declare w/h above and use there and here. figure out if I need
  //        different x/y offsets for each case too.
  return {x, y: y - h, w: c2d.lineWidth * 2 + metrics.width, h}
}

// to-do: merge with above.
export function c2dText2(
  c2d: C2D,
  text: string,
  opts: Readonly<XY> & {
    fill: string
    maxW: number
    lineHeight: number
    size: number
  },
): void {
  let y = opts.y
  for (const line of text.split('\n')) {
    y = wrapLine(c2d, line, {
      fill: opts.fill,
      x: opts.x,
      y,
      maxW: opts.maxW,
      lineHeight: opts.lineHeight,
      size: opts.size,
    })
  }
}

function wrapLine(
  c2d: C2D,
  text: string,
  opts: Readonly<XY> & {
    fill: string
    maxW: number
    lineHeight: number
    size: number
  },
): number {
  c2d.font = `${opts.size}px ${fontFamily}`
  const bulleted = text.startsWith('• ')
  const bulletW = c2d.measureText('• ').width
  let line = ''
  let y = opts.y
  for (const [i, word] of text.split(' ').entries()) {
    const test = `${line}${word} `
    const w = c2d.measureText(test).width

    if (w > opts.maxW && i) {
      c2d.fillText(
        line,
        opts.x + (!bulleted || line.startsWith('• ') ? 0 : bulletW),
        y,
      )
      line = `${word} `
      y += opts.lineHeight
    } else {
      line = test
    }
  }

  c2d.fillText(
    line,
    opts.x + (!bulleted || line.startsWith('• ') ? 0 : bulletW),
    y,
  )
  return y + opts.lineHeight
}
