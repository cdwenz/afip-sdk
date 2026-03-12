import { AfipError } from "../errors/AfipError"

export function checkAFIPErrors(result: any) {

  if (!result) return

  if (result.Errors) {

    const errors = result.Errors.Err

    if (Array.isArray(errors)) {

      const message = errors
        .map((e: any) => `${e.Code} - ${e.Msg}`)
        .join(", ")

      throw new AfipError(message, "AFIP_ERROR", errors)
    }

    throw new AfipError(
      `${errors.Code} - ${errors.Msg}`,
      "AFIP_ERROR",
      errors
    )
  }

  const obs =
    result.FeDetResp?.FECAEDetResponse?.Observaciones?.Obs

  if (obs) {

    const list = Array.isArray(obs) ? obs : [obs]

    list.forEach((o: any) => {
      console.warn(
        `AFIP Observación ${o.Code}: ${o.Msg}`
      )
    })
  }
}