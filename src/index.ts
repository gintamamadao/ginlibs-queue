import { isFunc } from 'ginlibs-type-check'
import { Lock } from 'ginlibs-lock'
import { sleep } from 'ginlibs-utils'

class EventQueue {
  private eventList: AnyFunction[] = []
  private lockKey = 'pause'
  private stopKey = 'stop'
  private lock: Lock = new Lock()

  public trigger = () => {
    if (
      this.eventList.length <= 0 ||
      this.lock.isLocked(this.lockKey) ||
      this.lock.isLocked(this.stopKey)
    ) {
      return this
    }
    this.lock.lock(this.lockKey)
    const event = this.eventList.shift()
    if (event && isFunc(event)) {
      Promise.resolve(event()).then(() => {
        this.lock.unLock(this.lockKey)
        this.trigger()
      })
    } else {
      this.lock.unLock(this.lockKey)
      this.trigger()
    }
    return this
  }

  public add = (fn: AnyFunction, interval = 0) => {
    const event = async () => {
      // 前面加上异步的话结果会不好预测
      await fn()
      await sleep(interval)
    }
    this.eventList.push(event)
    return this
  }

  public empty = () => {
    this.eventList.splice(0)
    return this
  }

  public stop = () => {
    this.empty()
    this.lock.lock(this.stopKey)
    return this
  }

  public restart = () => {
    this.empty()
    this.lock.unLock(this.stopKey)
    return this
  }

  public pause = () => {
    this.lock.lock(this.stopKey)
    return this
  }

  public continus = () => {
    this.lock.unLock(this.stopKey)
    this.trigger()
    return this
  }
}

export default EventQueue
