import axios from "axios"
import { createTRA } from "../utils/tra"
import { signTRA } from "../utils/signer"
import { parseXML } from "../utils/xml"
import { AFIPConfig } from "../types/config"

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

    const { data } = await axios.post(this.url, soap, {
      headers: { "Content-Type": "text/xml" }
    })

    const parsed = await parseXML(data)

    const cmsResponse =
      parsed["soap:Envelope"]["soap:Body"].loginCmsResponse.loginCmsReturn

    const decoded = Buffer.from(cmsResponse, "base64").toString()

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