"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseSoapFault = parseSoapFault;
const AfipError_1 = require("../errors/AfipError");
function parseSoapFault(xml) {
    if (!xml || typeof xml !== "string")
        return;
    const code = xml.match(/<faultcode.*?>(.*?)<\/faultcode>/)?.[1];
    const message = xml.match(/<faultstring>(.*?)<\/faultstring>/)?.[1];
    if (!code && !message)
        return;
    throw new AfipError_1.AfipError(message || "SOAP Fault", code);
}
