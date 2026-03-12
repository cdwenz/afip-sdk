export class Mutex {

  private locked = false
  private waiting: Array<() => void> = []

  async lock() {

    if (!this.locked) {
      this.locked = true
      return
    }

    return new Promise<void>((resolve) => {
      this.waiting.push(resolve)
    })
  }

  unlock() {

    if (this.waiting.length > 0) {
      const next = this.waiting.shift()
      next && next()
    } else {
      this.locked = false
    }

  }
}