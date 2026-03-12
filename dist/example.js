"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const index_1 = require("./index");
const afip = new index_1.AFIP({
    cuit: 20123456789,
    certPath: "./cert.crt",
    keyPath: "./private.key",
    production: false
});
async function run() {
    const last = await afip.getLastVoucher(1, 6);
    console.log("Último comprobante:", last);
    const invoice = await afip.createInvoice({
        puntoVenta: 1,
        tipoComprobante: 6,
        docTipo: 99,
        docNro: 0,
        items: [
            {
                description: "Producto test",
                quantity: 1,
                price: 1000,
                iva: 0
            }
        ]
    });
    console.log(invoice);
}
run();
