export function Bubble<T extends keyof HTMLElementEventMap>(
  type: T,
  detail: HTMLElementEventMap[T] extends CustomEvent
    ? HTMLElementEventMap[T]['detail']
    : never,
): CustomEvent<HTMLElementEventMap[T]> {
  // Composed bubbles through shadow DOM.
  return new CustomEvent(type, {
    bubbles: true,
    composed: true,
    detail: detail as CustomEvent['detail'],
  })
}
