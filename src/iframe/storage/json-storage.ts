export class JSONStorage {
  get<T>(key: string): T | undefined {
    const val = localStorage.getItem(key)
    return val == null ? undefined : JSON.parse(val)
  }

  put<T>(key: string, val: T): void {
    if (val == null) localStorage.removeItem(key)
    else localStorage.setItem(key, JSON.stringify(val))
  }
}
