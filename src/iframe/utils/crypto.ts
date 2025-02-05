// crypto is unavailable on HTTP (development).
if (devMode) {
  let i = 0
  crypto.randomUUID ??= () => `${i}-${i}-${i}-${i}-${i++}`
}
