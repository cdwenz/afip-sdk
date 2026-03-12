# @cdwenz/afip-sdk

SDK ligero para **Node.js** que simplifica la integración con los servicios de **facturación electrónica de AFIP (WSFEv1)** en Argentina.

Este proyecto busca ofrecer una interfaz moderna y clara para trabajar con AFIP sin tener que lidiar directamente con **SOAP, XML, autenticación WSAA y firma CMS**.

---

## Características

- Implementación completa del flujo de autenticación **WSAA**
- Firma automática del **TRA (loginTicketRequest)** usando certificado AFIP
- Cache automático de **token y sign**
- Integración directa con **WSFEv1**
- Soporte para **Facturas A, B y C**
- Manejo de **múltiples ítems**
- Soporte para **múltiples alícuotas de IVA**
- **Cálculo automático** de:
  - Neto
  - IVA
  - Total
- Manejo de **CAE y fecha de vencimiento**
- Validaciones básicas antes de enviar datos a AFIP
- Control de concurrencia para evitar **duplicación de comprobantes**
- Compatible con **homologación y producción**

---

## Instalación

```bash
npm install @cdwenz/afip-sdk
```

## Configuración

El SDK requiere:

- CUIT del emisor
- Certificado AFIP (.crt)
- Clave privada (.key)
- Entorno (homologación o producción)

```bash
import { AFIP } from "@cdwenz/afip-sdk"

const afip = new AFIP({
  cuit: 20123456789,
  certPath: "./cert.crt",
  keyPath: "./private.key",
  production: false
})
```
## Crear una factura

```bash
const invoice = await afip.createInvoice({

  puntoVenta: 1,
  tipoComprobante: 6, // Factura B

  docTipo: 99,
  docNro: 0,

  items: [
    {
      description: "Producto de prueba",
      quantity: 1,
      unitPrice: 1000,
      iva: 21
    }
  ]

})

console.log(invoice)
```

Respuesta:
```bash
{
  "comprobante": 1023,
  "cae": "70417054367476",
  "caeVto": "20260411",
  "total": 1210
}
```

## Métodos disponibles≤

login()

Obtiene un token y sign desde WSAA.

```bash
await afip.login()
```

getLastVoucher(puntoVenta, tipoComprobante)

Consulta el último comprobante autorizado.

```bash
const last = await afip.getLastVoucher(1, 6)
```

createInvoice(data)

Genera una factura electrónica utilizando FECAESolicitar.

Características:

- cálculo automático de totales
- múltiples ítems
- múltiples alícuotas de IVA

## Arquitectura

El SDK está organizado en módulos simples:

```bash
src
│
├ auth
│   └ wsaa.ts
│
├ wsfe
│   └ wsfe.ts
│
├ utils
│   ├ tra.ts
│   ├ signer.ts
│   ├ invoiceCalculator.ts
│   └ validateInvoice.ts
│
├ types
│   ├ config.ts
│   └ invoice.ts
│
└ index.ts
```

Esto permite mantener una separación clara entre:

- autenticación
- facturación
- utilidades
- tipos

## Entornos AFIP

El SDK soporta automáticamente ambos entornos.

Homologación

```bash
https://wsaahomo.afip.gov.ar
https://wswhomo.afip.gov.ar
```

Producción

```bash
https://wsaa.afip.gov.ar
https://servicios1.afip.gov.ar
```

Se controlan mediante:

```bash
production: true
```

## ⚠️ Requisitos

Para utilizar el SDK necesitas:

- Certificado digital AFIP válido
- Clave privada asociada al certificado
- Punto de venta habilitado para WSFEv1

## Casos de uso

Este SDK puede integrarse fácilmente en:

- APIs backend
- sistemas SaaS
- e-commerce
- POS
- plataformas gastronómicas
- sistemas administrativos

## Licencia

MIT

## Autor

Cristian Wenz

GitHub
https://github.com/cdwenz
