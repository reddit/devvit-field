/**
 * NOTE: Not built to handle duplicate values in the array
 */
export function diffArrays<T extends string | number>(
  oldList: T[],
  newList: T[],
): {
  duplicates: T[]
  toUnsubscribe: T[]
  toSubscribe: T[]
} {
  return {
    duplicates: oldList.filter(item => newList.includes(item)),
    toUnsubscribe: oldList.filter(item => !newList.includes(item)),
    toSubscribe: newList.filter(item => !oldList.includes(item)),
  }
}
