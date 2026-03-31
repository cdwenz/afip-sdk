"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createTRA = createTRA;
const xml_1 = require("./xml");
function createTRA(service = "wsfe") {
    const now = new Date();
    const generation = new Date(now.getTime() - 600000);
    const expiration = new Date(now.getTime() + 600000);
    const tra = {
        loginTicketRequest: {
            $: { version: "1.0" },
            header: {
                uniqueId: Math.floor(Date.now() / 1000),
                generationTime: generation.toISOString(),
                expirationTime: expiration.toISOString()
            },
            service
        }
    };
    return (0, xml_1.buildXML)(tra);
}
