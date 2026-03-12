import { Mutex } from "./lock"

const voucherMutex = new Mutex()

export async function lockVoucher() {
  await voucherMutex.lock()
}

export function unlockVoucher() {
  voucherMutex.unlock()
}