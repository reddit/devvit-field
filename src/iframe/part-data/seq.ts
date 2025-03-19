declare const seq: unique symbol
export type Seq = number & {readonly [seq]: never}
export type NoSeq = -1

export const noSeq: NoSeq = -1

export function Seq(seq: number): Seq | -1 {
  return seq < 0 ? noSeq : (seq as Seq)
}
