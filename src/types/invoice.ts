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
  moneda?: string

  // RG 5616
  condicionIVAReceptorId?: number

  items: InvoiceItem[]
}