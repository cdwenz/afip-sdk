import { AFIPConfig } from "./types/config"
import { WSAA } from "./auth/wsaa"
import { WSFE } from "./wsfe/wsfe"

export class AFIP {

  private wsaa: WSAA
  private wsfe: WSFE

  constructor(config: AFIPConfig) {

    this.wsaa = new WSAA(config)

    this.wsfe = new WSFE(
      this.wsaa,
      config.cuit,
      config.production
    )
  }

  login() {
    return this.wsaa.login()
  }

  getLastVoucher(pv: number, tipo: number) {
    return this.wsfe.getLastVoucher(pv, tipo)
  }

  createInvoice(data: any) {
    return this.wsfe.createInvoice(data)
  }
}