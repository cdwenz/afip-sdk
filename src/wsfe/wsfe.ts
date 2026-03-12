import axios from "axios"
import { parseXML } from "../utils/xml"
import { WSAA } from "../auth/wsaa"
import { CreateInvoiceData } from "../types/invoice"
import { checkAFIPErrors } from "../utils/afipError"
import { calculateInvoice } from "../utils/invoiceCalculator"
import { validateInvoice } from "../utils/validateInvoice"
import { IVA_MAP } from "../utils/ivaMap"
import { lockVoucher, unlockVoucher } from "../utils/voucherLock"

export class WSFE {

  constructor(private auth: WSAA, private cuit: number, private production = false) { }

  private get url() {
    return this.production
      ? "https://servicios1.afip.gov.ar/wsfev1/service.asmx"
      : "https://wswhomo.afip.gov.ar/wsfev1/service.asmx"
  }

  async getLastVoucher(pv: number, tipo: number) {

    const { token, sign } = await this.auth.login()

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
`

    const { data } = await axios.post(this.url, xml, {
      headers: { "Content-Type": "text/xml;charset=UTF-8" }
    })

    const parsed = await parseXML(data)

    return Number(
      parsed["soap:Envelope"]["soap:Body"]
        .FECompUltimoAutorizadoResponse
        .FECompUltimoAutorizadoResult
        .CbteNro
    )
  }

  async createInvoice(data: CreateInvoiceData) {

    await lockVoucher()
    try {
      validateInvoice(data)

      const calc = calculateInvoice(data.items)

      const last = await this.getLastVoucher(
        data.puntoVenta,
        data.tipoComprobante
      )

      const next = last + 1

      const { token, sign } = await this.auth.login()

      const ivaXML = Object.entries(calc.ivaGroups)
        .map(([rate, amount]) => {

          const id = IVA_MAP[Number(rate)]

          const base = data.items
            .filter(i => i.iva === Number(rate))
            .reduce((sum, i) => sum + i.unitPrice * i.quantity, 0)

          return `
<AlicIva>
  <Id>${id}</Id>
  <BaseImp>${base}</BaseImp>
  <Importe>${amount}</Importe>
</AlicIva>`
        })
        .join("")

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
`

      const { data: resp } = await axios.post(this.url, xml, {
        headers: { "Content-Type": "text/xml;charset=UTF-8" }
      })

      const parsed = await parseXML(resp)

      const result =
        parsed["soap:Envelope"]["soap:Body"]
          .FECAESolicitarResponse
          .FECAESolicitarResult

      checkAFIPErrors(result)

      const cae =
        result.FeDetResp.FECAEDetResponse.CAE

      const caeVto =
        result.FeDetResp.FECAEDetResponse.CAEFchVto

      return {
        cae,
        caeVto,
        comprobante: next,
        total: calc.total
      }
    } finally {

      unlockVoucher()

    }
  }
  //   async createInvoice(data: CreateInvoiceData) {

  //     const last = await this.getLastVoucher(
  //       data.puntoVenta,
  //       data.tipoComprobante
  //     )

  //     const next = last + 1

  //     const total = data.items.reduce(
  //       (sum, i) => sum + i.price * i.quantity,
  //       0
  //     )

  //     const xml = `
  // <soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/">
  //  <soapenv:Body>
  //   <FECAESolicitar>
  //    <Auth>
  //     <Token>${(await this.auth.login()).token}</Token>
  //     <Sign>${(await this.auth.login()).sign}</Sign>
  //     <Cuit>${this.cuit}</Cuit>
  //    </Auth>
  //    <FeCAEReq>
  //     <FeCabReq>
  //      <CantReg>1</CantReg>
  //      <PtoVta>${data.puntoVenta}</PtoVta>
  //      <CbteTipo>${data.tipoComprobante}</CbteTipo>
  //     </FeCabReq>
  //     <FeDetReq>
  //      <FECAEDetRequest>
  //       <Concepto>1</Concepto>
  //       <DocTipo>${data.docTipo}</DocTipo>
  //       <DocNro>${data.docNro}</DocNro>
  //       <CbteDesde>${next}</CbteDesde>
  //       <CbteHasta>${next}</CbteHasta>
  //       <CbteFch>${new Date().toISOString().slice(0, 10).replace(/-/g, "")}</CbteFch>
  //       <ImpTotal>${total}</ImpTotal>
  //       <ImpNeto>${total}</ImpNeto>
  //       <ImpIVA>0</ImpIVA>
  //       <MonId>${data.moneda || "PES"}</MonId>
  //       <MonCotiz>1</MonCotiz>
  //      </FECAEDetRequest>
  //     </FeDetReq>
  //    </FeCAEReq>
  //   </FECAESolicitar>
  //  </soapenv:Body>
  // </soapenv:Envelope>
  // `

  //     const { data: resp } = await axios.post(this.url, xml, {
  //       headers: { "Content-Type": "text/xml;charset=UTF-8" }
  //     })

  //     const parsed = await parseXML(resp)

  //     const result =
  //       parsed["soap:Envelope"]["soap:Body"]
  //         .FECAESolicitarResponse
  //         .FECAESolicitarResult

  //     checkAFIPErrors(result)

  //     return result
  //   }
}