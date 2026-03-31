"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Mutex = void 0;
class Mutex {
    constructor() {
        this.locked = false;
        this.waiting = [];
    }
    async lock() {
        if (!this.locked) {
            this.locked = true;
            return;
        }
        return new Promise((resolve) => {
            this.waiting.push(resolve);
        });
    }
    unlock() {
        if (this.waiting.length > 0) {
            const next = this.waiting.shift();
            next && next();
        }
        else {
            this.locked = false;
        }
    }
}
exports.Mutex = Mutex;
