import { parseStringPromise, Builder } from "xml2js"

export async function parseXML(xml: string) {
  return parseStringPromise(xml, { explicitArray: false })
}

export function buildXML(obj: any) {
  const builder = new Builder({ headless: true })
  return builder.buildObject(obj)
}