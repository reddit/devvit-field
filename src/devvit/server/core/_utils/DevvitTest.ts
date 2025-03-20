/**
 * Very much a WIP and carrying along in this project to hopefully get an artifact we
 * can open source in the future!
 */
import type {
  Comment,
  CommentSubmissionOptions,
  CrosspostOptions,
  CustomPostTextFallbackOptions,
  Devvit,
  EnrichedThumbnail,
  JSONValue,
  JobContext,
  KVStore,
  LinkFlair,
  Listing,
  MediaPlugin,
  Post,
  PostSuggestedCommentSort,
  PostTextOptions,
  SecureMedia,
  TriggerContext,
  User,
} from '@devvit/public-api'
import type {CacheOptions} from '@devvit/public-api/devvit/internals/promise_cache'
import Redis from 'ioredis'
import {RedisMemoryServer} from 'redis-memory-server'
import {type TestContext, it as itCore, vi} from 'vitest'

const redisServer = new RedisMemoryServer()
const host = await redisServer.getHost()
const port = await redisServer.getPort()

class MockSettings {
  // biome-ignore lint/suspicious/noExplicitAny: settings can be any type
  #settings: Record<string, any> = {}

  async get<T>(key: string): Promise<T | undefined> {
    return this.#settings[key]
  }

  async getAll<T>(): Promise<T> {
    return this.#settings as T
  }

  // biome-ignore lint/suspicious/noExplicitAny: settings can be any type
  update(settings: Record<string, any>) {
    this.#settings = settings
  }
}

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

  const mockSettings = new MockSettings()

  // biome-ignore lint/suspicious/noExplicitAny: settings can be any type
  export function updateSettings(settings: Record<string, any>): void {
    mockSettings.update(settings)
  }

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
    Devvit.Context['redis'],
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
      async getBuffer(key) {
        return (await con.getBuffer(makeKey(key))) ?? undefined
      },
      async exists(...keys) {
        return await con.exists(...keys.map(makeKey))
      },
      async rename(key, newKey) {
        return await con.rename(makeKey(key), makeKey(newKey))
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
      async hSetNX(key, field, value) {
        return await con.hsetnx(makeKey(key), field, value)
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
      async zRange(
        _key: string,
        start: number | string,
        stop: number | string,
        options = {
          by: 'rank' as 'rank' | 'score' | 'lex',
          reverse: false,
        },
      ) {
        let val: string[] = []
        const key = makeKey(_key)
        const lim = options.limit

        if (options.by === 'score') {
          if (options.reverse) {
            // zrevrangebyscore expects (max, min)
            if (lim) {
              val = await con.zrevrangebyscore(
                key,
                stop,
                start,
                'WITHSCORES',
                'LIMIT',
                lim.offset,
                lim.count,
              )
            } else {
              val = await con.zrevrangebyscore(key, stop, start, 'WITHSCORES')
            }
          } else {
            // zrangebyscore expects (min, max)
            if (lim) {
              val = await con.zrangebyscore(
                key,
                start,
                stop,
                'WITHSCORES',
                'LIMIT',
                lim.offset,
                lim.count,
              )
            } else {
              val = await con.zrangebyscore(key, start, stop, 'WITHSCORES')
            }
          }
        } else if (options.by === 'rank') {
          // For rank-based queries, we use zrange / zrevrange with numeric ranks
          if (options.reverse) {
            if (lim) {
              // Not supported by ioredis!
              val = await con.zrevrange(key, start, stop, 'WITHSCORES')
            } else {
              val = await con.zrevrange(key, start, stop, 'WITHSCORES')
            }
          } else {
            if (lim) {
              val = await con.zrange(
                key,
                start,
                stop,
                'LIMIT',
                lim.offset,
                lim.count,
                'WITHSCORES',
              )
            } else {
              val = await con.zrange(key, start, stop, 'WITHSCORES')
            }
          }
        } else if (options.by === 'lex') {
          // For lex-based queries, use zrangebylex / zrevrangebylex
          // These expect lex ordering, e.g. [ or ( as part of start/stop
          if (options.reverse) {
            if (lim) {
              val = await con.zrevrangebylex(
                key,
                start,
                stop,
                'LIMIT',
                lim.offset,
                lim.count,
              )
            } else {
              val = await con.zrevrangebylex(key, start, stop)
            }
          } else {
            if (lim) {
              val = await con.zrangebylex(
                key,
                start,
                stop,
                'LIMIT',
                lim.offset,
                lim.count,
              )
            } else {
              val = await con.zrangebylex(key, start, stop)
            }
          }
        }

        // Lex queries can't return scores, so just map them to a score of 0
        if (options.by === 'lex') {
          return val.map(member => ({member, score: 0}))
        }

        // For rank or score, Redis will return in [value, score, value, score, ...] form
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
  }: {prefix?: string} = {}): Devvit.Context['redis'] => {
    const appLevel = mockRedisClientMethods({prefix})
    // No prefix since they're global!
    const globalLevel = mockRedisClientMethods()

    return {
      ...appLevel,
      // TODO: Omit things like watch that isn't on there!
      global: globalLevel,
    }
  }

  interface ContextMap {
    ui: Devvit.Context
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
      // @ts-expect-error More #private complaints
      realtime: {
        send: vi.fn(),
      },
      scheduler: {
        runJob: vi.fn(),
        cancelJob: vi.fn(),
        listJobs: vi.fn(async () => []),
      },
      settings: mockSettings,
      reddit: {
        getCommentById(_id) {
          throw new Error('Not implemented in test')
        },
        submitComment: vi.fn(),
        sendPrivateMessage: vi.fn(),
        getUserById(_id) {
          throw new Error('Not implemented in test')
        },
        // @ts-expect-error complains about #private and ain't got time to fix it
        async submitPost(_options) {
          const post = {
            '#private': '',
            id: 't3_1in6n7n' as const,
            authorId: 't2_1i8t1yze9x' as const,
            authorName: 'banland-msw',
            subredditId: 't5_dii275' as const,
            subredditName: 'xBanland0',
            permalink: '/r/xBanland0/comments/1in6n7n/banfield_9/',
            title: 'BanField #9',
            body:
              '# DX_Bundle:\n' +
              '\n' +
              '    Gk8zZDc0YmM5YS1jMjQ3LTRmMGQtYTU3Mi03OWM1MzA3YTAzOWQuYmFubGFuZC1tc3cubWFpbi5kZXZ2aXQtZ2F0ZXdheS5yZWRkaXQuY29tIrUECixkZXZ2aXQucmVkZGl0LmN1c3RvbV9wb3N0LnYxYWxwaGEuQ3VzdG9tUG9zdBKwAQo3ZGV2dml0LnJlZGRpdC5jdXN0b21fcG9zdC52MWFscGhhLkN1c3RvbVBvc3QuUmVuZGVyUG9zdBIKUmVuZGVyUG9zdCozZGV2dml0LnJlZGRpdC5jdXN0b21fcG9zdC52MWFscGhhLlJlbmRlclBvc3RSZXF1ZXN0MjRkZXZ2aXQucmVkZGl0LmN1c3RvbV9wb3N0LnYxYWxwaGEuUmVuZGVyUG9zdFJlc3BvbnNlEqABCj5kZXZ2aXQucmVkZGl0LmN1c3RvbV9wb3N0LnYxYWxwaGEuQ3VzdG9tUG9zdC5SZW5kZXJQb3N0Q29udGVudBIRUmVuZGVyUG9zdENvbnRlbnQqJGRldnZpdC51aS5ibG9ja19raXQudjFiZXRhLlVJUmVxdWVzdDIlZGV2dml0LnVpLmJsb2NrX2tpdC52MWJldGEuVUlSZXNwb25zZRKiAQo/ZGV2dml0LnJlZGRpdC5jdXN0b21fcG9zdC52MWFscGhhLkN1c3RvbVBvc3QuUmVuZGVyUG9zdENvbXBvc2VyEhJSZW5kZXJQb3N0Q29tcG9zZXIqJGRldnZpdC51aS5ibG9ja19raXQudjFiZXRhLlVJUmVxdWVzdDIlZGV2dml0LnVpLmJsb2NrX2tpdC52MWJldGEuVUlSZXNwb25zZRoKQ3VzdG9tUG9zdCLhAQonZGV2dml0LnVpLmV2ZW50cy52MWFscGhhLlVJRXZlbnRIYW5kbGVyEqUBCjVkZXZ2aXQudWkuZXZlbnRzLnYxYWxwaGEuVUlFdmVudEhhbmRsZXIuSGFuZGxlVUlFdmVudBINSGFuZGxlVUlFdmVudCotZGV2dml0LnVpLmV2ZW50cy52MWFscGhhLkhhbmRsZVVJRXZlbnRSZXF1ZXN0Mi5kZXZ2aXQudWkuZXZlbnRzLnYxYWxwaGEuSGFuZGxlVUlFdmVudFJlc3BvbnNlGg5VSUV2ZW50SGFuZGxlcjJJEg8KBG5vZGUSBzIyLjEzLjASGAoOQGRldnZpdC9wcm90b3MSBjAuMTEuNhIcChJAZGV2dml0L3B1YmxpYy1hcGkSBjAuMTEuNg==\n' +
              '\n' +
              '# DX_Config:\n' +
              '\n' +
              '    EgA=\n' +
              '\n' +
              '# DX_Cached:\n' +
              '\n' +
              '    GqcBCqQBCp4BCAEqEhIHCgUNAADIQhoHCgUNAADIQhqFARKCAQgCElUIBCoWEgkKBw0AAGlDEAEaCQoHDQAAa0MQARo5KjcKI2h0dHBzOi8vaS5yZWRkLml0L3BhNnNwZzZwbmRoZTEuZ2lmEOkBGOsBIgpsb2FkaW5n4oCmIgQIARABSgkjMDAwMDAwZmZSFgoJIzAwMDAwMGZmEgkjMDAwMDAwZmYQwAI=',
            bodyHtml:
              '<!-- SC_OFF --><div class="md"><h1>DX_Bundle:</h1>\n' +
              '\n' +
              '<pre><code>Gk8zZDc0YmM5YS1jMjQ3LTRmMGQtYTU3Mi03OWM1MzA3YTAzOWQuYmFubGFuZC1tc3cubWFpbi5kZXZ2aXQtZ2F0ZXdheS5yZWRkaXQuY29tIrUECixkZXZ2aXQucmVkZGl0LmN1c3RvbV9wb3N0LnYxYWxwaGEuQ3VzdG9tUG9zdBKwAQo3ZGV2dml0LnJlZGRpdC5jdXN0b21fcG9zdC52MWFscGhhLkN1c3RvbVBvc3QuUmVuZGVyUG9zdBIKUmVuZGVyUG9zdCozZGV2dml0LnJlZGRpdC5jdXN0b21fcG9zdC52MWFscGhhLlJlbmRlclBvc3RSZXF1ZXN0MjRkZXZ2aXQucmVkZGl0LmN1c3RvbV9wb3N0LnYxYWxwaGEuUmVuZGVyUG9zdFJlc3BvbnNlEqABCj5kZXZ2aXQucmVkZGl0LmN1c3RvbV9wb3N0LnYxYWxwaGEuQ3VzdG9tUG9zdC5SZW5kZXJQb3N0Q29udGVudBIRUmVuZGVyUG9zdENvbnRlbnQqJGRldnZpdC51aS5ibG9ja19raXQudjFiZXRhLlVJUmVxdWVzdDIlZGV2dml0LnVpLmJsb2NrX2tpdC52MWJldGEuVUlSZXNwb25zZRKiAQo/ZGV2dml0LnJlZGRpdC5jdXN0b21fcG9zdC52MWFscGhhLkN1c3RvbVBvc3QuUmVuZGVyUG9zdENvbXBvc2VyEhJSZW5kZXJQb3N0Q29tcG9zZXIqJGRldnZpdC51aS5ibG9ja19raXQudjFiZXRhLlVJUmVxdWVzdDIlZGV2dml0LnVpLmJsb2NrX2tpdC52MWJldGEuVUlSZXNwb25zZRoKQ3VzdG9tUG9zdCLhAQonZGV2dml0LnVpLmV2ZW50cy52MWFscGhhLlVJRXZlbnRIYW5kbGVyEqUBCjVkZXZ2aXQudWkuZXZlbnRzLnYxYWxwaGEuVUlFdmVudEhhbmRsZXIuSGFuZGxlVUlFdmVudBINSGFuZGxlVUlFdmVudCotZGV2dml0LnVpLmV2ZW50cy52MWFscGhhLkhhbmRsZVVJRXZlbnRSZXF1ZXN0Mi5kZXZ2aXQudWkuZXZlbnRzLnYxYWxwaGEuSGFuZGxlVUlFdmVudFJlc3BvbnNlGg5VSUV2ZW50SGFuZGxlcjJJEg8KBG5vZGUSBzIyLjEzLjASGAoOQGRldnZpdC9wcm90b3MSBjAuMTEuNhIcChJAZGV2dml0L3B1YmxpYy1hcGkSBjAuMTEuNg==\n' +
              '</code></pre>\n' +
              '\n' +
              '<h1>DX_Config:</h1>\n' +
              '\n' +
              '<pre><code>EgA=\n' +
              '</code></pre>\n' +
              '\n' +
              '<h1>DX_Cached:</h1>\n' +
              '\n' +
              '<pre><code>GqcBCqQBCp4BCAEqEhIHCgUNAADIQhoHCgUNAADIQhqFARKCAQgCElUIBCoWEgkKBw0AAGlDEAEaCQoHDQAAa0MQARo5KjcKI2h0dHBzOi8vaS5yZWRkLml0L3BhNnNwZzZwbmRoZTEuZ2lmEOkBGOsBIgpsb2FkaW5n4oCmIgQIARABSgkjMDAwMDAwZmZSFgoJIzAwMDAwMGZmEgkjMDAwMDAwZmYQwAI=\n' +
              '</code></pre>\n' +
              '</div><!-- SC_ON -->',
            url: 'https://www.reddit.com/r/xBanland0/comments/1in6n7n/banfield_9/',
            thumbnail: undefined,
            score: 1,
            numberOfComments: 0,
            numberOfReports: 0,
            createdAt: new Date('2025-02-11T19:12:57.000Z'),
            approved: false,
            spam: false,
            stickied: false,
            removed: false,
            removedBy: undefined,
            removedByCategory: undefined,
            archived: false,
            edited: false,
            locked: false,
            nsfw: false,
            quarantined: false,
            spoiler: false,
            hidden: false,
            ignoringReports: false,
            distinguishedBy: undefined,
            flair: {
              backgroundColor: '',
              cssClass: undefined,
              text: undefined,
              type: 'text',
              templateId: undefined,
              richtext: [],
              textColor: 'dark',
            },
            secureMedia: undefined,
            modReportReasons: [],
            userReportReasons: [],
            comments: [],
            approvedAtUtc: Date.now(),
            bannedAtUtc: Date.now(),
          }

          // @ts-expect-error not worth it
          class MockPost implements Post {
            get id(): `t3_${string}` {
              return `t3_${Math.random().toString()}`
            }

            addRemovalNote(_options: {
              reasonId: string
              modNote?: string
            }): Promise<void> {
              throw new Error('Not implemented in test')
            }
            approve(): Promise<void> {
              throw new Error('Not implemented in test')
            }
            get approved(): boolean {
              return post.approved
            }
            get approvedAtUtc(): number {
              return post.approvedAtUtc
            }
            get archived(): boolean {
              return post.archived
            }
            get authorId(): `t2_${string}` | undefined {
              return `t2_${Math.random().toString()}`
            }
            get authorName(): string {
              return post.authorName
            }
            get bannedAtUtc(): number {
              return post.bannedAtUtc
            }
            get body(): string | undefined {
              return post.body
            }
            get bodyHtml(): string | undefined {
              return post.bodyHtml
            }
            get comments(): Listing<Comment> {
              throw new Error('Not implemented in test')
            }
            get createdAt(): Date {
              return new Date(post.createdAt)
            }
            crosspost(
              _options: Omit<CrosspostOptions, 'postId'>,
            ): Promise<Post> {
              throw new Error('Not implemented in test')
            }
            delete(): Promise<void> {
              throw new Error('Not implemented in test')
            }
            distinguish(): Promise<void> {
              throw new Error('Not implemented in test')
            }
            distinguishAsAdmin(): Promise<void> {
              throw new Error('Not implemented in test')
            }
            get distinguishedBy(): string | undefined {
              return post.distinguishedBy
            }
            edit(_options: PostTextOptions): Promise<void> {
              throw new Error('Not implemented in test')
            }
            addComment(_options: CommentSubmissionOptions): Promise<Comment> {
              throw new Error('Not implemented in test')
            }
            get edited(): boolean {
              return post.edited
            }
            get flair(): LinkFlair | undefined {
              // biome-ignore lint/suspicious/noExplicitAny: <explanation>
              return post.flair as any
            }
            getAuthor(): Promise<User | undefined> {
              throw new Error('Not implemented in test')
            }
            getEnrichedThumbnail(): Promise<EnrichedThumbnail | undefined> {
              throw new Error('Not implemented in test')
            }
            get hidden(): boolean {
              return post.hidden
            }
            hide(): Promise<void> {
              throw new Error('Not implemented in test')
            }
            ignoreReports(): Promise<void> {
              throw new Error('Not implemented in test')
            }
            get ignoringReports(): boolean {
              return post.ignoringReports
            }
            isApproved(): boolean {
              throw new Error('Not implemented in test')
            }
            isArchived(): boolean {
              throw new Error('Not implemented in test')
            }
            isDistinguishedBy(): string | undefined {
              throw new Error('Not implemented in test')
            }
            isEdited(): boolean {
              throw new Error('Not implemented in test')
            }
            isHidden(): boolean {
              throw new Error('Not implemented in test')
            }
            isIgnoringReports(): boolean {
              throw new Error('Not implemented in test')
            }
            isLocked(): boolean {
              throw new Error('Not implemented in test')
            }
            isNsfw(): boolean {
              throw new Error('Not implemented in test')
            }
            isQuarantined(): boolean {
              throw new Error('Not implemented in test')
            }
            isRemoved(): boolean {
              throw new Error('Not implemented in test')
            }
            isSpam(): boolean {
              throw new Error('Not implemented in test')
            }
            isSpoiler(): boolean {
              throw new Error('Not implemented in test')
            }
            isStickied(): boolean {
              throw new Error('Not implemented in test')
            }
            lock(): Promise<void> {
              throw new Error('Not implemented in test')
            }
            get locked(): boolean {
              return post.locked
            }
            markAsNsfw(): Promise<void> {
              throw new Error('Not implemented in test')
            }
            markAsSpoiler(): Promise<void> {
              throw new Error('Not implemented in test')
            }
            get modReportReasons(): string[] {
              return []
            }
            get nsfw(): boolean {
              return post.nsfw
            }
            get numberOfComments(): number {
              return post.numberOfComments
            }
            get numberOfReports(): number {
              return post.numberOfReports
            }
            get permalink(): string {
              return post.permalink
            }
            get quarantined(): boolean {
              return post.quarantined
            }
            remove(_isSpam?: boolean): Promise<void> {
              throw new Error('Not implemented in test')
            }
            get removed(): boolean {
              return post.removed
            }
            get removedBy(): string | undefined {
              return post.removedBy
            }
            get removedByCategory(): string | undefined {
              return post.removedByCategory
            }
            get score(): number {
              return post.score
            }
            get secureMedia(): SecureMedia | undefined {
              return post.secureMedia
            }
            setCustomPostPreview(_ui: JSX.ComponentFunction): Promise<void> {
              throw new Error('Not implemented in test')
            }
            setSuggestedCommentSort(
              _suggestedSort: PostSuggestedCommentSort,
            ): Promise<void> {
              throw new Error('Not implemented in test')
            }
            setTextFallback(
              _options: CustomPostTextFallbackOptions,
            ): Promise<void> {
              throw new Error('Not implemented in test')
            }
            get spam(): boolean {
              return post.spam
            }
            get spoiler(): boolean {
              return post.spoiler
            }
            get stickied(): boolean {
              return post.stickied
            }
            sticky(_position?: 1 | 2 | 3 | 4): Promise<void> {
              throw new Error('Not implemented in test')
            }
            get subredditId(): `t5_${string}` {
              return `t5_${Math.random().toString()}`
            }
            get subredditName(): string {
              return post.subredditName
            }
            get thumbnail():
              | {url: string; height: number; width: number}
              | undefined {
              return post.thumbnail
            }
            get title(): string {
              return post.title
            }
            toJSON(): Pick<
              Post,
              | 'id'
              | 'authorId'
              | 'authorName'
              | 'subredditId'
              | 'subredditName'
              | 'permalink'
              | 'title'
              | 'body'
              | 'bodyHtml'
              | 'url'
              | 'thumbnail'
              | 'score'
              | 'numberOfComments'
              | 'numberOfReports'
              | 'createdAt'
              | 'approved'
              | 'spam'
              | 'stickied'
              | 'removed'
              | 'removedBy'
              | 'removedByCategory'
              | 'archived'
              | 'edited'
              | 'locked'
              | 'nsfw'
              | 'quarantined'
              | 'spoiler'
              | 'hidden'
              | 'ignoringReports'
              | 'distinguishedBy'
              | 'flair'
              | 'secureMedia'
              | 'userReportReasons'
              | 'modReportReasons'
            > {
              // @ts-expect-error no worth it
              return post
            }
            undistinguish(): Promise<void> {
              throw new Error('Not implemented in test')
            }
            unhide(): Promise<void> {
              throw new Error('Not implemented in test')
            }
            unignoreReports(): Promise<void> {
              throw new Error('Not implemented in test')
            }
            unlock(): Promise<void> {
              throw new Error('Not implemented in test')
            }
            unmarkAsNsfw(): Promise<void> {
              throw new Error('Not implemented in test')
            }
            unmarkAsSpoiler(): Promise<void> {
              throw new Error('Not implemented in test')
            }
            unsticky(): Promise<void> {
              throw new Error('Not implemented in test')
            }
            get url(): string {
              return post.url
            }
            get userReportReasons(): string[] {
              return []
            }
          }

          return new MockPost()
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

    async function func(vitestContext: TestContext & object) {
      await fn(context, vitestContext)
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
