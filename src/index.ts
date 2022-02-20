import { isFunc } from 'ginlibs-type-check'
import { Lock } from 'ginlibs-lock'
import { sleep } from 'ginlibs-utils'

const LOCK_KEY = 'pause'
const STOP_KEY = 'stop'

export class EventQueue {
  private eventList: AnyFunction[] = []
  private lock: Lock = new Lock()
  private iterator: Iterator<any> | undefined
  private iteratorResult: IteratorResult<any, any> | undefined

  public trigger = () => {
    if (this.eventList.length <= 0) {
      this.iterator = undefined
      this.iteratorResult = undefined
      return this
    }

    if (this.lock.isLocked(LOCK_KEY) || this.lock.isLocked(STOP_KEY)) {
      return this
    }

    this.lock.lock(LOCK_KEY)
    this.iterator = this.iterator || this.execute()
    Promise.resolve(this.iteratorResult?.value).then((val) => {
      this.iteratorResult = this.iterator.next(val)
      this.lock.unLock(LOCK_KEY)
      this.trigger()
    })
    return this
  }

  public execute = function* () {
    let result: any = undefined
    while (this.eventList.length > 0) {
      const event = this.eventList.shift()
      if (event && isFunc(event)) {
        result = yield event(result)
      }
    }
  }

  public add = (fn: AnyFunction, interval = 0) => {
    const event = async (prevEventRes?: any) => {
      // 前面加上异步的话结果会不好预测
      if (isFunc(fn)) {
        const result = await fn(prevEventRes)
        await sleep(interval)
        return result
      }
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
