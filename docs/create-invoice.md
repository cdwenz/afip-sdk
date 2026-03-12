# Crear factura

const invoice = await afip.createInvoice({
  puntoVenta: 1,
  tipoComprobante: 6,
  docTipo: 99,
  docNro: 0,
  items: [
    {
      description: "Producto",
      quantity: 1,
      price: 1000,
      iva: 0
    }
  ]
})