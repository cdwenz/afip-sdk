export function checkAFIPErrors(result: any) {

  if (!result) return

  if (result.Errors) {

    const errors = result.Errors.Err

    if (Array.isArray(errors)) {
      throw new Error(
        errors.map((e: any) => `${e.Code} - ${e.Msg}`).join(", ")
      )
    }

    throw new Error(`${errors.Code} - ${errors.Msg}`)
  }

  if (result.FeDetResp?.FECAEDetResponse?.Observaciones) {

    const obs =
      result.FeDetResp.FECAEDetResponse.Observaciones.Obs

    console.warn(
      "AFIP Observación:",
      `${obs.Code} - ${obs.Msg}`
    )
  }
}