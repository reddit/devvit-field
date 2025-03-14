export function abbreviateNumber(value: number): string {
  if (value >= 1e9) {
    return `${(value / 1e9).toFixed(1)}B`
  }

  if (value >= 1e6) {
    return `${(value / 1e6).toFixed(1)}M`
  }

  if (value >= 1e3) {
    return `${(value / 1e3).toFixed(1)}K`
  }

  return value.toString()
}

export function padNumber(value: number, length: number): string {
  return value.toString().padStart(length, '0')
}
