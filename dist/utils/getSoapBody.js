"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSoapBody = getSoapBody;
const AfipError_1 = require("../errors/AfipError");
function getSoapBody(parsed) {
    const envelope = parsed["soap:Envelope"] ||
        parsed["soapenv:Envelope"] ||
        parsed["Envelope"];
    if (!envelope) {
        throw new AfipError_1.AfipError("Respuesta SOAP inválida: Envelope no encontrado", "INVALID_SOAP_ENVELOPE", parsed);
    }
    const body = envelope["soap:Body"] ||
        envelope["soapenv:Body"] ||
        envelope["Body"];
    if (!body) {
        throw new AfipError_1.AfipError("Respuesta SOAP inválida: Body no encontrado", "INVALID_SOAP_BODY", parsed);
    }
    return body;
}
