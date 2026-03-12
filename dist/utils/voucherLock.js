"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.lockVoucher = lockVoucher;
exports.unlockVoucher = unlockVoucher;
const lock_1 = require("./lock");
const voucherMutex = new lock_1.Mutex();
async function lockVoucher() {
    await voucherMutex.lock();
}
function unlockVoucher() {
    voucherMutex.unlock();
}
