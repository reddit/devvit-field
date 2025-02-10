export const Layer = {
  Cursor: 0,
  UIFore: 1,
  UIBack: 2,
  Default: 3,
  Level: 4,
} as const
export type Layer = keyof typeof Layer

export const layerDrawOrder: readonly Layer[] = [
  'Level',
  'Default',
  'UIBack',
  'UIFore',
  'Cursor',
]
