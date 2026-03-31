"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkAFIPErrors = checkAFIPErrors;
function checkAFIPErrors(result) {
    if (!result)
        return;
    if (result.Errors) {
        const errors = result.Errors.Err;
        if (Array.isArray(errors)) {
            throw new Error(errors.map((e) => `${e.Code} - ${e.Msg}`).join(", "));
        }
        throw new Error(`${errors.Code} - ${errors.Msg}`);
    }
    if (result.FeDetResp?.FECAEDetResponse?.Observaciones) {
        const obs = result.FeDetResp.FECAEDetResponse.Observaciones.Obs;
        console.warn("AFIP Observación:", `${obs.Code} - ${obs.Msg}`);
    }
}
