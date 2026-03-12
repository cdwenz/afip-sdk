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
      "-in",
      "/dev/stdin",
      "-signer",
      certPath,
      "-inkey",
      keyPath,
      "-nodetach",
      "-outform",
      "-nosmimecap",
      "DER",
      "-binary"
    ],
    {
      input: xml
    }
  )

  if (proc.status !== 0) {
    throw new Error(proc.stderr.toString())
  }

  return proc.stdout.toString("base64")
}