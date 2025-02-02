if (devMode) {
  let i = 0
  crypto.randomUUID ??= () => `${i}-${i}-${i}-${i}-${i++}`
}
