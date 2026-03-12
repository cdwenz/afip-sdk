import { AfipError } from "../errors/AfipError"

export function getSoapBody(parsed: any) {

  const envelope =
    parsed["soap:Envelope"] ||
    parsed["soapenv:Envelope"] ||
    parsed["Envelope"]

  if (!envelope) {
    throw new AfipError(
      "Respuesta SOAP inválida: Envelope no encontrado",
      "INVALID_SOAP_ENVELOPE",
      parsed
    )
  }

  const body =
    envelope["soap:Body"] ||
    envelope["soapenv:Body"] ||
    envelope["Body"]

  if (!body) {
    throw new AfipError(
      "Respuesta SOAP inválida: Body no encontrado",
      "INVALID_SOAP_BODY",
      parsed
    )
  }

  return body
}