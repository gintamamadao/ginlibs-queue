import EventQueue from '../index'
import { AsyncLock } from 'ginlibs-lock'

describe('串行队列事件', () => {
  const q = new EventQueue()

  test('自动事件队列', async () => {
    const al = new AsyncLock()
    let str = ''
    const fn = (v: string) => {
      str += v
    }
    q.add(() => fn('1'))
      .add(() => fn('2'))
      .add(() => fn('3'))
      .add(() => fn('4'))
      .add(() => al.unLock())
      .trigger()

    await al.getLock()
    expect(str).toBe('1234')
  })

  test('按设置的时间间隔执行', async () => {
    const al = new AsyncLock()
    const bl = new AsyncLock()
    let str = ''
    const fn = (v: string) => {
      str += v
    }
    q.add(() => fn('1'), 100)
      .add(() => fn('2'), 100)
      .add(() => al.unLock())
      .add(() => fn('3'), 200)
      .add(() => fn('4'))
      .add(() => bl.unLock())
      .trigger()

    await al.getLock()
    expect(str).toBe('12')

    await al.lockTime(10)
    expect(str).toBe('123')

    await al.lockTime(100)
    expect(str).toBe('123')

    await bl.getLock()
    expect(str).toBe('1234')
  })

  test('多次触发不会打乱执行顺序', async () => {
    const al = new AsyncLock()
    const bl = new AsyncLock()
    let str = ''
    const fn = (v: string) => {
      str += v
    }
    q.add(() => fn('1'), 30)
      .add(() => fn('2'), 30)
      .add(() => fn('3'), 30)
      .add(() => al.unLock())
      .add(() => fn('4'), 30)
      .add(() => fn('5'), 30)
      .add(() => bl.unLock())

    q.trigger()
    q.trigger()
    q.trigger()

    await al.getLock()
    expect(str).toBe('123')

    q.trigger()
    q.trigger()
    q.trigger()

    await bl.getLock()
    expect(str).toBe('12345')
  })

  test('如果事件返回的结果是 Promise 会等 Promise 执行完才进入下一步', async () => {
    const al = new AsyncLock()
    let str = ''
    const fn = (v: string) => {
      str += v
    }
    q.add(() => fn('1'))
      .add(() => al.lockTime(100), 0)
      .add(() => fn('2'))
      .add(() => fn('3'))
      .trigger()

    await al.lockTime(80)
    expect(str).toBe('1')
    await al.lockTime(30)
    expect(str).toBe('123')
  })

  test('清空事件', async () => {
    const al = new AsyncLock()
    let str = ''
    const fn = (v: string) => {
      str += v
    }
    q.add(() => fn('1'))
      .add(() => fn('2'))
      .add(() => fn('3'))

    q.empty()
    q.add(() => al.unLock()).trigger()

    await al.getLock()
    expect(str).toBe('')
  })

  test('停止和重启事件', async () => {
    const al = new AsyncLock()
    let str = ''
    const fn = (v: string) => {
      str += v
    }
    q.add(() => fn('1'))
      .add(() => fn('2'))
      .add(() => fn('3'))

    q.stop()
    q.add(() => fn('1'))
      .add(() => al.unLock())
      .trigger()

    await al.lockTime(20)
    expect(str).toBe('')

    q.restart()
    q.add(() => fn('2'))
      .add(() => al.unLock())
      .trigger()

    await al.getLock()
    expect(str).toBe('2')
  })

  test('暂停和继续事件', async () => {
    const al = new AsyncLock()
    const bl = new AsyncLock()
    let str = ''
    const fn = (v: string) => {
      str += v
    }
    q.add(() => fn('1'), 20)
      .add(() => al.unLock())
      .add(() => fn('2'))
      .add(() => fn('3'))
      .add(() => bl.unLock())
      .trigger()

    await al.getLock()
    expect(str).toBe('1')
    q.pause()
    q.trigger()

    await al.lockTime(40)
    expect(str).toBe('1')

    q.continus()
    await bl.getLock()
    expect(str).toBe('123')
  })
})
