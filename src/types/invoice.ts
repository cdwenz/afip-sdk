export interface InvoiceItem {
  description: string
  quantity: number
  unitPrice: number
  iva: number
}

export interface CreateInvoiceData {
  puntoVenta: number
  tipoComprobante: number
  docTipo: number
  docNro: number
  items: InvoiceItem[]
  moneda?: string
}