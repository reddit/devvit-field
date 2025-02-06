import type {Devvit} from '@devvit/public-api'

type BitfieldGet = [
  get: 'get',
  encoding: BitfieldEncoding,
  offset: BitfieldOffset,
]
type BitfieldSet = [
  set: 'set',
  encoding: BitfieldEncoding,
  offset: BitfieldOffset,
  val: number | string,
]
type BitfieldOverflow = [
  overflow: 'overflow',
  behavior: 'wrap' | 'sat' | 'fail',
]
type BitfieldIncrBy = [
  incrBy: 'incrBy' | 'incrby',
  encoding: BitfieldEncoding,
  offset: BitfieldOffset,
  increment?: number | string | undefined,
]
type BitfieldEncoding = `${'i' | 'u'}${number}` // up to 64 bits for signed integers, and up to 63 bits for unsigned integers
type BitfieldOffset = number | `#${number}` | string

export type BitfieldCommand =
  | BitfieldGet
  | BitfieldSet
  | BitfieldIncrBy
  | BitfieldOverflow

export type NewRedisApiClient = Devvit.Context['redis'] & {
  bitfield(key: string, ...cmds: BitfieldCommand): Promise<number[]>
  bitfield(
    key: string,
    ...cmds: [...BitfieldCommand, ...BitfieldCommand]
  ): Promise<number[]>
  bitfield(
    key: string,
    ...cmds: [...BitfieldCommand, ...BitfieldCommand, ...BitfieldCommand]
  ): Promise<number[]>
  bitfield(
    key: string,
    ...cmds: [
      ...BitfieldCommand,
      ...BitfieldCommand,
      ...BitfieldCommand,
      ...(string | number)[],
    ]
  ): Promise<number[]>
}

export type NewDevvitContext = Omit<Devvit.Context, 'redis'> & {
  redis: NewRedisApiClient
}
