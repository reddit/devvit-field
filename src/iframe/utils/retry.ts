// to-do: can these be configurable by Init message? Load occurs before Init.
const defaultDelayMillis: number = 1_000
const defaultRetries: number = 3

export async function retry<T>(
  fn: () => Promise<T>,
  retries?: number,
  delayMillis?: number,
): Promise<T> {
  delayMillis ??= defaultDelayMillis
  retries ??= defaultRetries

  for (let i = 0; ; i++)
    try {
      return await fn()
    } catch (err) {
      if (i >= retries) throw err
      await new Promise(fulfil => setTimeout(fulfil, delayMillis))
      delayMillis *= 2
    }
}
