import { InvoiceItem } from "../types/invoice"

export function calculateInvoice(items: InvoiceItem[]) {

  let neto = 0
  let totalIVA = 0

  const ivaGroups: Record<string, number> = {}

  for (const item of items) {

    const subtotal = item.unitPrice * item.quantity
    const ivaAmount = subtotal * (item.iva / 100)

    neto += subtotal
    totalIVA += ivaAmount

    if (!ivaGroups[item.iva]) {
      ivaGroups[item.iva] = 0
    }

    ivaGroups[item.iva] += ivaAmount
  }

  const total = neto + totalIVA

  return {
    neto,
    totalIVA,
    total,
    ivaGroups
  }
}