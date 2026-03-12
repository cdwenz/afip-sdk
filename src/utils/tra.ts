import { buildXML } from "./xml"

export function createTRA(service: string = "wsfe") {
  const now = new Date()

  const generation = new Date(now.getTime() - 600000)
  const expiration = new Date(now.getTime() + 600000)

  const tra = {
    loginTicketRequest: {
      $: { version: "1.0" },
      header: {
        uniqueId: Math.floor(Date.now() / 1000),
        generationTime: generation.toISOString(),
        expirationTime: expiration.toISOString()
      },
      service
    }
  }

  return buildXML(tra)
}