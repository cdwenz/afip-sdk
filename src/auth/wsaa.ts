import axios from "axios"
import { createTRA } from "../utils/tra"
import { signTRA } from "../utils/signer"
import { parseXML } from "../utils/xml"
import { AFIPConfig } from "../types/config"
import { parseSoapFault } from "../utils/parseSoapFault"
import { getSoapBody } from "../utils/getSoapBody"

export class WSAA {

  private token: string | null = null
  private sign: string | null = null
  private expiration: Date | null = null

  constructor(private config: AFIPConfig) { }

  private get url() {
    return this.config.production
      ? "https://wsaa.afip.gov.ar/ws/services/LoginCms"
      : "https://wsaahomo.afip.gov.ar/ws/services/LoginCms"
  }

  async login() {

    if (
      this.token &&
      this.expiration &&
      this.expiration.getTime() - Date.now() > 60000
    ) {
      return {
        token: this.token,
        sign: this.sign
      }
    }

    const tra = createTRA()

    const cms = signTRA(
      tra,
      this.config.certPath,
      this.config.keyPath
    )

    const soap = `
      <soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/">
      <soapenv:Body>
        <loginCms>
        <in0>${cms}</in0>
        </loginCms>
      </soapenv:Body>
      </soapenv:Envelope>
      `

    let data

    try {

      const response = await axios.post(this.url, soap, {
        headers: {
          "Content-Type": "text/xml;charset=UTF-8",
          "SOAPAction": ""
        }
      })

      data = response.data

      console.log("WSAA RAW RESPONSE:\n", data)

    } catch (err: any) {

      const xml = err.response?.data

      parseSoapFault(xml)

      throw err
    }

    const parsed = await parseXML(data)

    const body = getSoapBody(parsed)

    const fault =
      body.Fault ||
      body["soapenv:Fault"]

    if (fault) {
      throw new Error(
        `${fault.faultcode}: ${fault.faultstring}`
      )
    }

    const login = body.loginCmsResponse

    const cmsNode =
      login.loginCmsReturn ||
      login["ns1:loginCmsReturn"] ||
      login["loginCmsReturn"]

    if (!cmsNode) {
      console.error("WSAA BODY:", JSON.stringify(body, null, 2))
      throw new Error("WSAA response inválida: loginCmsReturn no encontrado")
    }

    // xml2js puede devolver string o { _: "texto" }
    const cmsText =
      typeof cmsNode === "string"
        ? cmsNode
        : cmsNode._ || cmsNode["#text"]

    if (!cmsText) {
      throw new Error("WSAA response inválida: contenido de loginCmsReturn vacío")
    }

    let decoded

    if (cmsText.trim().startsWith("<")) {
      decoded = cmsText
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .replace(/&quot;/g, '"')
        .replace(/&amp;/g, "&")
    } else {
      decoded = Buffer.from(cmsText, "base64").toString()
    }

    const ticket = await parseXML(decoded)

    this.token = ticket.loginTicketResponse.credentials.token
    this.sign = ticket.loginTicketResponse.credentials.sign

    this.expiration = new Date(
      ticket.loginTicketResponse.header.expirationTime
    )

    return {
      token: this.token,
      sign: this.sign
    }
  }
}