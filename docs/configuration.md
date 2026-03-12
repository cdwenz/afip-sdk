# Configuración

El SDK requiere:

- CUIT
- certificado AFIP
- clave privada
- entorno (homologación o producción)

Ejemplo:

const afip = new AFIP({
  cuit: 20123456789,
  certPath: "./cert.crt",
  keyPath: "./private.key",
  production: false
})