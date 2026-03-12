import { CreateInvoiceData } from "../types/invoice"

export function validateInvoice(data: CreateInvoiceData) {

  if (!data.items.length) {
    throw new Error("La factura debe tener al menos un item")
  }

  if (!data.puntoVenta) {
    throw new Error("Punto de venta requerido")
  }

  if (!data.tipoComprobante) {
    throw new Error("Tipo de comprobante requerido")
  }

  if (!data.docTipo) {
    throw new Error("Tipo de documento requerido")
  }

}