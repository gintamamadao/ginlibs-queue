import { isFunc } from 'ginlibs-type-check'
import { Lock } from 'ginlibs-lock'
import { sleep } from 'ginlibs-utils'

const LOCK_KEY = 'pause'
const STOP_KEY = 'stop'

export class EventQueue {
  private eventList: AnyFunction[] = []
  private lock: Lock = new Lock()

  public trigger = () => {
    if (
      this.eventList.length <= 0 ||
      this.lock.isLocked(LOCK_KEY) ||
      this.lock.isLocked(STOP_KEY)
    ) {
      return this
    }
    this.lock.lock(LOCK_KEY)
    const event = this.eventList.shift()
    if (event && isFunc(event)) {
      Promise.resolve(event()).then(() => {
        this.lock.unLock(LOCK_KEY)
        this.trigger()
      })
    } else {
      this.lock.unLock(LOCK_KEY)
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
    this.lock.lock(STOP_KEY)
    return this
  }

  public restart = () => {
    this.empty()
    this.lock.unLock(STOP_KEY)
    return this
  }

  public pause = () => {
    this.lock.lock(STOP_KEY)
    return this
  }

  public continus = () => {
    this.lock.unLock(STOP_KEY)
    this.trigger()
    return this
  }
}

export default EventQueue
