"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AfipError = void 0;
class AfipError extends Error {
    constructor(message, code, detail) {
        super(message);
        this.name = "AfipError";
        this.code = code;
        this.detail = detail;
    }
}
exports.AfipError = AfipError;
