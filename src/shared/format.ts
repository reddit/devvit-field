/**
 * Abbreviate and round a number to a human-readable string.
 * @param value - The number to abbreviate.
 * @returns The abbreviated number as a string.
 * @example
 * ```ts
 * abbreviateNumber(1000) // '1.0K'
 * abbreviateNumber(1000000) // '1.0M'
 * abbreviateNumber(1000000000) // '1.0B'
 * abbreviateNumber(999) // '999'
 * ```
 */

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

/**
 * Pad a number with leading zeros to a specified length.
 * @param value - The number to pad.
 * @param length - The desired length of the padded number.
 * @returns The padded number as a string.
 * @example
 * ```ts
 * padNumber(5, 3) // '005'
 * padNumber(123, 5) // '00123'
 * ```
 */

export function padNumber(value: number, length: number): string {
  return value.toString().padStart(length, '0')
}

/**
 * Replace tokens in a string with corresponding values from a data object.
 * @param string - The string to hydrate.
 * @param data - The data object containing token-value pairs.
 * @returns The hydrated string.
 * @example
 * ```ts
 * const template = 'Hello, {name}!'
 * const data = {name: 'World'}
 * hydrateString(template, data) // 'Hello, World!'
 * ```
 */

export function hydrateString(
  string: string,
  data: {
    [key: string]: string
  },
): string {
  return string.replace(/{(.*?)}/g, (match, token) => {
    return data[token] || match
  })
}
