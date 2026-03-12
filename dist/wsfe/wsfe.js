"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WSFE = void 0;
const axios_1 = __importDefault(require("axios"));
const xml_1 = require("../utils/xml");
const afipError_1 = require("../utils/afipError");
const invoiceCalculator_1 = require("../utils/invoiceCalculator");
const validateInvoice_1 = require("../utils/validateInvoice");
const ivaMap_1 = require("../utils/ivaMap");
const voucherLock_1 = require("../utils/voucherLock");
class WSFE {
    constructor(auth, cuit, production = false) {
        this.auth = auth;
        this.cuit = cuit;
        this.production = production;
    }
    get url() {
        return this.production
            ? "https://servicios1.afip.gov.ar/wsfev1/service.asmx"
            : "https://wswhomo.afip.gov.ar/wsfev1/service.asmx";
    }
    async getLastVoucher(pv, tipo) {
        const { token, sign } = await this.auth.login();
        const xml = `
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/">
 <soapenv:Body>
  <FECompUltimoAutorizado>
   <Auth>
    <Token>${token}</Token>
    <Sign>${sign}</Sign>
    <Cuit>${this.cuit}</Cuit>
   </Auth>
   <PtoVta>${pv}</PtoVta>
   <CbteTipo>${tipo}</CbteTipo>
  </FECompUltimoAutorizado>
 </soapenv:Body>
</soapenv:Envelope>
`;
        const { data } = await axios_1.default.post(this.url, xml, {
            headers: { "Content-Type": "text/xml;charset=UTF-8" }
        });
        const parsed = await (0, xml_1.parseXML)(data);
        return Number(parsed["soap:Envelope"]["soap:Body"]
            .FECompUltimoAutorizadoResponse
            .FECompUltimoAutorizadoResult
            .CbteNro);
    }
    async createInvoice(data) {
        await (0, voucherLock_1.lockVoucher)();
        try {
            (0, validateInvoice_1.validateInvoice)(data);
            const calc = (0, invoiceCalculator_1.calculateInvoice)(data.items);
            const last = await this.getLastVoucher(data.puntoVenta, data.tipoComprobante);
            const next = last + 1;
            const { token, sign } = await this.auth.login();
            const ivaXML = Object.entries(calc.ivaGroups)
                .map(([rate, amount]) => {
                const id = ivaMap_1.IVA_MAP[Number(rate)];
                const base = data.items
                    .filter(i => i.iva === Number(rate))
                    .reduce((sum, i) => sum + i.unitPrice * i.quantity, 0);
                return `
<AlicIva>
  <Id>${id}</Id>
  <BaseImp>${base}</BaseImp>
  <Importe>${amount}</Importe>
</AlicIva>`;
            })
                .join("");
            const xml = `
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/">
 <soapenv:Body>
  <FECAESolicitar>
   <Auth>
    <Token>${token}</Token>
    <Sign>${sign}</Sign>
    <Cuit>${this.cuit}</Cuit>
   </Auth>
   <FeCAEReq>
    <FeCabReq>
     <CantReg>1</CantReg>
     <PtoVta>${data.puntoVenta}</PtoVta>
     <CbteTipo>${data.tipoComprobante}</CbteTipo>
    </FeCabReq>
    <FeDetReq>
     <FECAEDetRequest>

      <Concepto>1</Concepto>

      <DocTipo>${data.docTipo}</DocTipo>
      <DocNro>${data.docNro}</DocNro>

      <CbteDesde>${next}</CbteDesde>
      <CbteHasta>${next}</CbteHasta>

      <CbteFch>${new Date().toISOString().slice(0, 10).replace(/-/g, "")}</CbteFch>

      <ImpTotal>${calc.total}</ImpTotal>
      <ImpTotConc>0</ImpTotConc>
      <ImpNeto>${calc.neto}</ImpNeto>
      <ImpOpEx>0</ImpOpEx>
      <ImpIVA>${calc.totalIVA}</ImpIVA>
      <ImpTrib>0</ImpTrib>

      <MonId>${data.moneda || "PES"}</MonId>
      <MonCotiz>1</MonCotiz>

      <Iva>
        ${ivaXML}
      </Iva>

     </FECAEDetRequest>
    </FeDetReq>
   </FeCAEReq>
  </FECAESolicitar>
 </soapenv:Body>
</soapenv:Envelope>
`;
            const { data: resp } = await axios_1.default.post(this.url, xml, {
                headers: { "Content-Type": "text/xml;charset=UTF-8" }
            });
            const parsed = await (0, xml_1.parseXML)(resp);
            const result = parsed["soap:Envelope"]["soap:Body"]
                .FECAESolicitarResponse
                .FECAESolicitarResult;
            (0, afipError_1.checkAFIPErrors)(result);
            const cae = result.FeDetResp.FECAEDetResponse.CAE;
            const caeVto = result.FeDetResp.FECAEDetResponse.CAEFchVto;
            return {
                cae,
                caeVto,
                comprobante: next,
                total: calc.total
            };
        }
        finally {
            (0, voucherLock_1.unlockVoucher)();
        }
    }
}
exports.WSFE = WSFE;
