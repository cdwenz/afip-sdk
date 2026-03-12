import fs from "fs"
import { spawnSync } from "child_process"

export function signTRA(xml: string, certPath: string, keyPath: string) {

  const cert = fs.readFileSync(certPath)
  const key = fs.readFileSync(keyPath)

  const proc = spawnSync(
    "openssl",
    [
      "cms",
      "-sign",
      "-signer",
      certPath,
      "-inkey",
      keyPath,
      "-nodetach",
      "-outform",
      "DER",
      "-binary"
    ],
    {
      input: xml
    }
  )

  if (proc.status !== 0) {
    throw new Error("Error firmando TRA con OpenSSL")
  }

  return proc.stdout.toString("base64")
}