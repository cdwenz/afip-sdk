import axios from "axios"
import { parseXML } from "../utils/xml"
import { WSAA } from "../auth/wsaa"
import { CreateInvoiceData } from "../types/invoice"
import { checkAFIPErrors } from "../utils/checkAFIPErrors"
import { calculateInvoice } from "../utils/invoiceCalculator"
import { validateInvoice } from "../utils/validateInvoice"
import { IVA_MAP } from "../utils/ivaMap"
import { lockVoucher, unlockVoucher } from "../utils/voucherLock"
import { parseSoapFault } from "../utils/parseSoapFault"
import { getSoapBody } from "../utils/getSoapBody"

// const FEV1_NS = 'xmlns="http://ar.gov.afip.dif.FEV1/"'

const SOAP_ACTIONS = {
  LAST_VOUCHER: "http://ar.gov.afip.dif.FEV1/FECompUltimoAutorizado",
  CREATE_INVOICE: "http://ar.gov.afip.dif.FEV1/FECAESolicitar"
}

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
            <FECompUltimoAutorizado xmlns="http://ar.gov.afip.dif.FEV1/">
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

    let data

    try {

      const response = await axios.post(this.url, xml, {
        headers: {
          "Content-Type": "text/xml;charset=UTF-8",
          "SOAPAction": SOAP_ACTIONS.LAST_VOUCHER
        }
      })

      data = response.data

    } catch (err: any) {

      parseSoapFault(err.response?.data)

      throw err
    }

    const parsed = await parseXML(data)

    const body = getSoapBody(parsed)

    return Number(
      body.FECompUltimoAutorizadoResponse
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

      console.log("AFIP last voucher:", last)
      console.log("Next voucher:", next)

      const { token, sign } = await this.auth.login()

      const isFacturaC = data.tipoComprobante === 11

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

      const ivaBlock = isFacturaC
        ? ""
        : `
<Iva>
  ${ivaXML}
</Iva>`

      const xml = `
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/">
 <soapenv:Body>
  <FECAESolicitar xmlns="http://ar.gov.afip.dif.FEV1/">

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
      ${data.condicionIVAReceptorId
          ? `<CondicionIVAReceptorId>${data.condicionIVAReceptorId}</CondicionIVAReceptorId>`
          : ""}

      <CbteDesde>${next}</CbteDesde>
      <CbteHasta>${next}</CbteHasta>

      <CbteFch>${new Date().toISOString().slice(0, 10).replace(/-/g, "")}</CbteFch>

      <ImpTotal>${isFacturaC ? calc.neto : calc.total}</ImpTotal>
      <ImpTotConc>0</ImpTotConc>
      <ImpNeto>${calc.neto}</ImpNeto>
      <ImpOpEx>0</ImpOpEx>
      <ImpIVA>${isFacturaC ? 0 : calc.totalIVA}</ImpIVA>
      <ImpTrib>0</ImpTrib>

      <MonId>${data.moneda || "PES"}</MonId>
      <MonCotiz>1</MonCotiz>

      ${ivaBlock}

     </FECAEDetRequest>
    </FeDetReq>

   </FeCAEReq>

  </FECAESolicitar>
 </soapenv:Body>
</soapenv:Envelope>
`

      let resp

      try {

        const response = await axios.post(this.url, xml, {
          headers: {
            "Content-Type": "text/xml;charset=UTF-8",
            "SOAPAction": SOAP_ACTIONS.CREATE_INVOICE
          }
        })

        resp = response.data

      } catch (err: any) {

        parseSoapFault(err.response?.data)

        throw err

      }

      const parsed = await parseXML(resp)

      const body = getSoapBody(parsed)

      const result =
        body.FECAESolicitarResponse
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
        total: isFacturaC ? calc.neto : calc.total
      }

    } finally {

      unlockVoucher()

    }

  }
}