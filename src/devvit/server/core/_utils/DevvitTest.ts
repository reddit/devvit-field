/**
 * Very much a WIP and carrying along in this project to hopefully get an artifact we
 * can open source in the future!
 */
import type {
  Devvit,
  JSONValue,
  JobContext,
  KVStore,
  MediaPlugin,
  TriggerContext,
} from '@devvit/public-api'
import type {CacheOptions} from '@devvit/public-api/devvit/internals/promise_cache'
import Redis from 'ioredis'
import {RedisMemoryServer} from 'redis-memory-server'
import {type TestContext, it as itCore} from 'vitest'
import type {BitfieldCommand, NewDevvitContext} from './NewDevvitContext'

const redisServer = new RedisMemoryServer()
const host = await redisServer.getHost()
const port = await redisServer.getPort()

/**
 * A test harness for Devvit applications. This module attempts to provide a high
 * quality, in-memory implement of the Devvit API to allow for reliable testing.
 *
 * Note: Windows support requires some more steps:
 * https://github.com/mhassan1/redis-memory-server?tab=readme-ov-file#windows
 */
// @ts-expect-error erasable-syntax
export namespace DevvitTest {
  export const con: Redis = new Redis({
    host,
    port,
  })

  /**
   * Completely resets the Redis instance. Useful when you are writing
   * tests that rely on global Redis.
   */
  export const resetRedis = async (): Promise<void> => {
    await con.flushall()
  }

  // TODO: Need a callback to clear global redis since it can leak across tests.
  // I think you want the leakage, but you need a way to clear it in test hooks like beforeEach

  const mockKVStore = (): KVStore => {
    return {
      async delete(_key) {
        throw new Error('KVStore.delete not implemented in test')
      },
      async get(_key) {
        throw new Error('KVStore.get not implemented in test')
      },
      async list() {
        throw new Error('KVStore.list not implemented in test')
      },
      async put(_key, _value) {
        throw new Error('KVStore.put not implemented in test')
      },
    }
  }
  const mockMediaStore = (): MediaPlugin => {
    return {
      async upload(_opts) {
        throw new Error('MediaStore.upload not implemented in test')
      },
    }
  }
  const mockCache: <T extends JSONValue>(
    fn: () => Promise<T>,
    options: CacheOptions,
  ) => Promise<T> = async (_fn, _options) => {
    // TODO: Implement cache
    throw new Error('Cache not implemented in test')
  }

  const mockRedisClientMethods = ({
    prefix,
  }: {prefix?: string | undefined} = {}): Omit<
    NewDevvitContext['redis'],
    'global'
  > => {
    const makeKey = (key: string) => (prefix ? `${prefix}:${key}` : key)
    return {
      async del(...keys) {
        con.del(...keys.map(makeKey))
      },
      async expire(key, seconds) {
        await con.expire(makeKey(key), seconds)
      },
      async expireTime(key) {
        return await con.expiretime(makeKey(key))
      },
      async get(key) {
        const val = await con.get(makeKey(key))
        return val === null ? undefined : val
      },
      async getRange(key, start, end) {
        return await con.getrange(makeKey(key), start, end)
      },
      // TODO: This API is inconsistent with zAdd! Or maybe zAdd is inconsistent with this
      // and hMGet?
      async hDel(key, fields) {
        return await con.hdel(makeKey(key), ...fields)
      },
      async hdel(key, fields) {
        return await this.hDel(key, fields)
      },
      async hGet(key, field) {
        const val = await con.hget(makeKey(key), field)
        return val === null ? undefined : val
      },
      async hget(key, field) {
        return await this.hGet(key, field)
      },
      async hGetAll(key) {
        return await con.hgetall(makeKey(key))
      },
      async hgetall(key) {
        return await this.hGetAll(key)
      },
      async hIncrBy(key, field, value) {
        return await con.hincrby(makeKey(key), field, value)
      },
      async hincrby(key, field, value) {
        return await this.hIncrBy(key, field, value)
      },
      async hKeys(key) {
        return await con.hkeys(makeKey(key))
      },
      async hkeys(key) {
        return await this.hKeys(key)
      },
      async hLen(key) {
        return await con.hlen(makeKey(key))
      },
      async hlen(key) {
        return await this.hLen(key)
      },
      async hMGet(key, fields) {
        return await con.hmget(makeKey(key), ...fields)
      },
      async hScan(_key, cursor, pattern, count) {
        let val: [cursor: string, elements: string[]]

        const key = makeKey(_key)

        if (pattern && count) {
          val = await con.hscan(key, cursor, 'MATCH', pattern, 'COUNT', count)
        } else if (pattern) {
          val = await con.hscan(key, cursor, 'MATCH', pattern)
        } else if (count) {
          val = await con.hscan(key, cursor, 'COUNT', count)
        } else {
          val = await con.hscan(key, cursor)
        }

        const fieldValues: {field: string; value: string}[] = []
        for (let i = 0; i < val[1].length; i += 2) {
          fieldValues.push({field: val[1][i]!, value: val[1][i + 1]!})
        }

        return {
          cursor: Number(val[0]),
          fieldValues,
        }
      },
      async hscan(key, cursor, pattern, count) {
        return await this.hScan(key, cursor, pattern, count)
      },
      async hSet(key, fieldValues) {
        return await con.hset(makeKey(key), fieldValues)
      },
      async hset(key, fieldValues) {
        return await this.hSet(key, fieldValues)
      },
      async incrBy(key, value) {
        const val = await con.incrby(makeKey(key), value)
        return Number(val)
      },
      async mGet(_keys) {
        throw new Error('Redis.mGet not implemented in test')
      },
      async mget(keys) {
        return await this.mGet(keys)
      },
      async mSet(_keyValues) {
        throw new Error('Redis.mSet not implemented in test')
      },
      async mset(keyValues) {
        return await this.mSet(keyValues)
      },
      async set(key, value, _options) {
        // TODO: Handle options
        const val = con.set(makeKey(key), value)
        return val
      },
      async setRange(key, offset, value) {
        return await con.setrange(makeKey(key), offset, value)
      },
      async strLen(key) {
        return await con.strlen(makeKey(key))
      },
      async strlen(key) {
        return await this.strLen(key)
      },
      async type(key) {
        return await con.type(makeKey(key))
      },
      async watch(..._keys) {
        throw new Error('Redis.watch not implemented in test')
      },
      async zAdd(key, ...members) {
        return await con.zadd(
          makeKey(key),
          ...members.flatMap(member => [member.score, member.member]),
        )
      },
      async zCard(key) {
        return await con.zcard(makeKey(key))
      },
      async zIncrBy(key, member, value) {
        const val = await con.zincrby(makeKey(key), value, member)
        return Number(val)
      },
      // TODO: No clue what the default options are
      async zRange(_key, start, stop, options = {by: 'rank', reverse: false}) {
        let val: string[] = []
        const key = makeKey(_key)
        if (options?.by === 'score') {
          val = options.reverse
            ? await con.zrevrange(key, start, stop, 'WITHSCORES')
            : await con.zrange(key, start, stop, 'WITHSCORES')
        } else if (options?.by === 'rank') {
          val = options.reverse
            ? await con.zrevrange(key, start, stop, 'WITHSCORES')
            : await con.zrange(key, start, stop, 'WITHSCORES')
          // TODO: Need to implement this part of our API
          /**
           * When using by: 'lex', the start and stop inputs will be prepended with [ by default, unless they already
           * begin with [, ( or are one of the special values + or -.
           */
        } else if (options?.by === 'lex') {
          val = options.reverse
            ? await con.zrevrangebylex(key, start, stop)
            : await con.zrangebylex(key, start, stop)
        }

        // Lex doesn't support with scores
        if (options?.by === 'lex') {
          return val.map(v => ({member: v, score: 0}))
        }

        const results: {member: string; score: number}[] = []
        for (let i = 0; i < val.length; i += 2) {
          results.push({member: val[i]!, score: Number(val[i + 1])})
        }

        return results
      },
      async zRank(key, member) {
        const val = await con.zrank(makeKey(key), member)
        return val === null ? undefined : Number(val)
      },
      async zRem(key, members) {
        return await con.zrem(makeKey(key), ...members)
      },
      async zRemRangeByLex(key, min, max) {
        return await con.zremrangebylex(makeKey(key), min, max)
      },
      async zRemRangeByRank(key, start, stop) {
        return await con.zremrangebyrank(makeKey(key), start, stop)
      },
      async zRemRangeByScore(key, min, max) {
        return await con.zremrangebyscore(makeKey(key), min, max)
      },
      async zScan(_key, cursor, pattern, count) {
        let val: [cursor: string, elements: string[]]

        const key = makeKey(_key)

        if (pattern && count) {
          val = await con.zscan(key, cursor, 'MATCH', pattern, 'COUNT', count)
        } else if (pattern) {
          val = await con.zscan(key, cursor, 'MATCH', pattern)
        } else if (count) {
          val = await con.zscan(key, cursor, 'COUNT', count)
        } else {
          val = await con.zscan(key, cursor)
        }

        const members: {member: string; score: number}[] = []
        for (let i = 0; i < val[1].length; i += 2) {
          members.push({member: val[1][i + 1]!, score: Number(val[1][i])})
        }

        return {
          cursor: Number(val[0]),
          members,
        }
      },
      async zScore(key, member) {
        const val = await con.zscore(makeKey(key), member)
        return val === null ? undefined : Number(val)
      },
      // @ts-expect-error - too lazy to type it with all the overloads
      async bitfield(key, ...cmds: BitfieldCommand) {
        // @ts-expect-error
        return (await con.bitfield(makeKey(key), ...cmds)) as number[]
      },
    }
  }

  const mockRedisClient = ({
    prefix,
  }: {prefix?: string} = {}): NewDevvitContext['redis'] => {
    const appLevel = mockRedisClientMethods({prefix})
    // No prefix since they're global!
    const globalLevel = mockRedisClientMethods()

    return {
      ...appLevel,
      // TODO: Omit things like watch that isn't on there!
      global: globalLevel,
    }
  }

  // const mockRedditClient = (): Devvit.Context['reddit'] => {
  // return mockClass(RedditAPIClient)
  // }

  interface ContextMap {
    ui: NewDevvitContext
    job: JobContext
    trigger: TriggerContext
  }

  export const createMockUIContext = ({
    redisPrefix,
  }: {
    redisPrefix: string
  }): ContextMap['ui'] => {
    return {
      appName: 'test',
      appVersion: '1.0.0',
      // TODO: Not implemented yet
      // @ts-expect-error
      assets: {},
      cache: mockCache,
      debug: {
        metadata: {},
      },
      kvStore: mockKVStore(),
      media: mockMediaStore(),
      userId: 't2_1cgemlvzgq',
      postId: 't3_1cgemlvzgq',
      commentId: undefined,
      dimensions: {
        height: 300,
        width: 300,
        scale: 2,
        fontScale: 1,
      },
      subredditName: 'testSubreddit',
      redis: mockRedisClient({prefix: redisPrefix}),
      // @ts-expect-error todo
      reddit: {
        getUserById(_id) {
          throw new Error('Not implemented in test')
        },
        submitPost(_options) {
          throw new Error('Not implemented in test')
        },
      },
    }
  }

  // Overload 1: No options -> assume UI context
  function itImpl(
    name: string,
    fn: (context: ContextMap['ui']) => Promise<void>,
  ): Promise<void>

  // Overload 2: Context is explicitly specified
  function itImpl<K extends keyof ContextMap>(
    name: string,
    fn: (context: ContextMap[K]) => Promise<void>,
    options?: {context?: ContextMap[K]; contextType?: K; _only?: boolean},
  ): Promise<void>

  function itImpl<K extends keyof ContextMap = 'ui'>(
    name: string,
    fn: (
      context: ContextMap[K],
      vitestContext: TestContext & object,
    ) => Promise<void>,
    options?: {context?: ContextMap[K]; contextType?: K; _only?: boolean},
  ): Promise<void> | void {
    const {
      contextType = 'ui',
      context = createMockUIContext({redisPrefix: generateRandomString(10)}),
      _only = false,
    } = options || {}

    if (contextType !== 'ui') {
      throw new Error('Only UI context is supported at The moment')
    }

    function func(vitestContext: TestContext & object) {
      fn(context, vitestContext)
    }

    if (_only) {
      itCore.only(name, func)
    } else {
      itCore(name, func)
    }
  }

  type ItFunction = {
    /** Overload #1: no options => 'ui' context by default */
    (
      name: string,
      fn: (
        context: ContextMap['ui'],
        vitestCtx: TestContext & object,
      ) => Promise<void> | void,
    ): Promise<void> | void

    /** Overload #2: specify contextType => typed accordingly */
    <K extends keyof ContextMap>(
      name: string,
      fn: (
        context: ContextMap[K],
        vitestCtx: TestContext & object,
      ) => Promise<void> | void,
      options: {contextType: K; context?: ContextMap[K]; _only?: boolean},
    ): Promise<void> | void

    /** The `.only` property must also have the same overloads */
    only: {
      (
        name: string,
        fn: (
          context: ContextMap['ui'],
          vitestCtx: TestContext & object,
        ) => Promise<void> | void,
      ): Promise<void> | void

      <K extends keyof ContextMap>(
        name: string,
        fn: (
          context: ContextMap[K],
          vitestCtx: TestContext & object,
        ) => Promise<void> | void,
        options: {contextType: K; context?: ContextMap[K]; _only?: boolean},
      ): Promise<void> | void
    }
  }

  export const it: ItFunction = Object.assign(
    // The main function
    (...args: Parameters<typeof itImpl>) => {
      // Just forward to `itImpl`
      return itImpl(...args)
    },
    {
      // The .only variant
      only: (...args: Parameters<typeof itImpl>) => {
        // Just forward to `itImpl`
        return itImpl(args[0], args[1], {...args[2], _only: true})
      },
    },
  ) as unknown as ItFunction
}

/**
 * Generates a random alphanumeric string of specified length
 * @param length - The desired length of the random string
 * @returns A random string containing letters (a-z, A-Z) and numbers (0-9)
 * @throws Error if length is less than 1
 */
function generateRandomString(length: number): string {
  if (length < 1) {
    throw new Error('Length must be at least 1')
  }

  const characters =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  const charactersLength = characters.length
  let result = ''

  // Create a Uint32Array to get random values
  const randomBuffer = new Uint32Array(length)
  crypto.getRandomValues(randomBuffer)

  for (let i = 0; i < length; i++) {
    // Use modulo to get a random index within the characters string
    // @ts-expect-error
    const randomIndex = randomBuffer[i] % charactersLength
    result += characters.charAt(randomIndex)
  }

  return result
}
