export class NotVerifiedEmailError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'NotVerifiedEmailError'
  }
}
