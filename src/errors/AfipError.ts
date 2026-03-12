export class AfipError extends Error {
  code?: string
  detail?: any

  constructor(message: string, code?: string, detail?: any) {
    super(message)
    this.name = "AfipError"
    this.code = code
    this.detail = detail
  }
}