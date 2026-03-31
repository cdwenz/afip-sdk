"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AFIP = void 0;
const wsaa_1 = require("./auth/wsaa");
const wsfe_1 = require("./wsfe/wsfe");
class AFIP {
    constructor(config) {
        this.wsaa = new wsaa_1.WSAA(config);
        this.wsfe = new wsfe_1.WSFE(this.wsaa, config.cuit, config.production);
    }
    login() {
        return this.wsaa.login();
    }
    getLastVoucher(pv, tipo) {
        return this.wsfe.getLastVoucher(pv, tipo);
    }
    createInvoice(data) {
        return this.wsfe.createInvoice(data);
    }
}
exports.AFIP = AFIP;
