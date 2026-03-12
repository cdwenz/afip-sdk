import { AfipError } from "../errors/AfipError"

export function parseSoapFault(xml: string) {

  if (!xml || typeof xml !== "string") return

  const code =
    xml.match(/<faultcode.*?>(.*?)<\/faultcode>/)?.[1]

  const message =
    xml.match(/<faultstring>(.*?)<\/faultstring>/)?.[1]

  if (!code && !message) return

  throw new AfipError(
    message || "SOAP Fault",
    code
  )
}