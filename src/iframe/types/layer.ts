export type Layer =
  | 'Cursor'
  | 'Default'
  | 'Level'
  | 'UIBackground'
  | 'UIForeground'

// to-do: Hidden when changing layers is supported by Zoo.
export const layerDrawOrder: readonly Layer[] = [
  'Level',
  'Default',
  'UIBackground',
  'UIForeground',
  'Cursor',
]
