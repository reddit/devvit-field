import en from './locales/en.json' assert {type: 'json'}

// Locale identifier type
export type LocaleId = 0 // Right now only '0' (for English)

// Locale names (for display or reference)
export type LocaleName = 'EN'
export const localeName: {readonly [localeId in LocaleId]: LocaleName} = {
  0: 'EN',
}

// A map of locales to their translation data (currently only English)
export const localesMap: {readonly [localeId in LocaleId]: typeof en} = {
  0: en,
}

/**
 * Retrieve a translation based on the locale and key.
 * @param key The key of the translation.
 * @param localeId The locale identifier. Defaults to 0 (English).
 * @returns The translation or an empty string if not found.
 * @example
 * localize('hello', 0); // 'World'
 * localize('nonExistentKey', 0); // ''
 * localize('hello'); // 'World'
 */

export function localize(key: keyof typeof en, localeId?: LocaleId): string {
  const EMPTY_RESULT = ''
  const DEFAULT_LOCALE = 0
  return localesMap[localeId ?? DEFAULT_LOCALE][key] ?? EMPTY_RESULT
}

export const lineBreakToken = '↵'
export const variableStartToken = '{'
export const variableEndToken = '}'
