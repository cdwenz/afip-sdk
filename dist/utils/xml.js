"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseXML = parseXML;
exports.buildXML = buildXML;
const xml2js_1 = require("xml2js");
async function parseXML(xml) {
    return (0, xml2js_1.parseStringPromise)(xml, { explicitArray: false });
}
function buildXML(obj) {
    const builder = new xml2js_1.Builder({ headless: true });
    return builder.buildObject(obj);
}
