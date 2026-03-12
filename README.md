# @cdwenz/afip-sdk

SDK Node.js para facturación electrónica AFIP (WSFEv1).

## Instalación

npm install @cdwenz/afip-sdk

## Uso

import { AFIP } from "@cdwenz/afip-sdk"

const afip = new AFIP({
  cuit: 20123456789,
  certPath: "./cert.crt",
  keyPath: "./private.key",
  production: false
})

const invoice = await afip.createInvoice({
  puntoVenta: 1,
  tipoComprobante: 6,
  docTipo: 99,
  docNro: 0,
  items: [
    {
      description: "Producto",
      quantity: 1,
      unitPrice: 1000,
      iva: 21
    }
  ]
})