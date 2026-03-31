"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.signTRA = signTRA;
const fs_1 = __importDefault(require("fs"));
const child_process_1 = require("child_process");
function signTRA(xml, certPath, keyPath) {
    const cert = fs_1.default.readFileSync(certPath);
    const key = fs_1.default.readFileSync(keyPath);
    const proc = (0, child_process_1.spawnSync)("openssl", [
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
        "DER",
        "-binary",
    ], {
        input: xml
    });
    if (proc.status !== 0) {
        throw new Error(proc.stderr.toString());
    }
    return proc.stdout.toString("base64");
}
