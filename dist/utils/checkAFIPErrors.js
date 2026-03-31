"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkAFIPErrors = checkAFIPErrors;
const AfipError_1 = require("../errors/AfipError");
function checkAFIPErrors(result) {
    if (!result)
        return;
    if (result.Errors) {
        const errors = result.Errors.Err;
        if (Array.isArray(errors)) {
            const message = errors
                .map((e) => `${e.Code} - ${e.Msg}`)
                .join(", ");
            throw new AfipError_1.AfipError(message, "AFIP_ERROR", errors);
        }
        throw new AfipError_1.AfipError(`${errors.Code} - ${errors.Msg}`, "AFIP_ERROR", errors);
    }
    const obs = result.FeDetResp?.FECAEDetResponse?.Observaciones?.Obs;
    if (obs) {
        const list = Array.isArray(obs) ? obs : [obs];
        list.forEach((o) => {
            console.warn(`AFIP Observación ${o.Code}: ${o.Msg}`);
        });
    }
}
