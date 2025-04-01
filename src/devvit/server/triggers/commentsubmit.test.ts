import type {CommentV2} from '@devvit/protos/types/devvit/reddit/v2alpha/commentv2'
import type {UserV2} from '@devvit/protos/types/devvit/reddit/v2alpha/userv2'
import {expect, vi} from 'vitest'
import type {Profile} from '../../../shared/save'
import {USER_IDS} from '../../../shared/test-utils'
import {config2} from '../../../shared/types/level'
import {DevvitTest} from '../core/_utils/DevvitTest'
import {userSet} from '../core/user'
import {commentSubmit} from './commentsubmit.js'

const fakeComment: Readonly<CommentV2> = {
  id: 'id',
  parentId: 'parentId',
  body: 'body',
  author: USER_IDS.TEAM_2_PLAYER_1,
  numReports: 0,
  collapsedBecauseCrowdControl: false,
  spam: false,
  deleted: false,
  subredditId: 'FieldGame',
  postId: config2.levels[0]!.postId,
  upvotes: 0,
  downvotes: 0,
  score: 0,
  createdAt: Number(new Date()),
  languageCode: 'en',
  lastModifiedAt: Number(new Date()),
  gilded: false,
  permalink: '/r/FieldGame/comments/id',
  hasMedia: false,
  elementTypes: [],
}

const fakeAuthor: Readonly<UserV2> = {
  id: USER_IDS.TEAM_2_PLAYER_1,
  name: 'userFoo',
  isGold: false,
  snoovatarImage: '',
  url: '',
  spam: false,
  banned: false,
  karma: 0,
  iconImage: '',
  description: '',
  suspended: false,
}

const testProfile: Readonly<Profile> = {
  currentLevel: 1,
  globalPointCount: 0,
  lastPlayedChallengeNumberForLevel: 0,
  lastPlayedChallengeNumberCellsClaimed: 0,
  t2: USER_IDS.TEAM_2_PLAYER_1,
  username: 'userFoo',
  superuser: false,
  hasVerifiedEmail: true,
}

const testCases = [
  {
    title: 'CommentSubmit - Leaves comment when user is on right level',
    profile: testProfile,
    level: 1,
    comment: {
      ...fakeComment,
      postId: config2.levels[1]!.postId,
    },
    expected: {
      removeComment: false,
      replyText: false,
    },
  },
  {
    title: 'CommentSubmit - Leaves comment alone when user is superuser',
    profile: {
      ...testProfile,
      superuser: true,
    },
    level: 0,
    comment: fakeComment,
    expected: {
      removeComment: false,
      replyText: false,
    },
  },
  {
    title: 'CommentSubmit - Removes comment when user is on wrong level',
    profile: testProfile,
    level: 0,
    comment: fakeComment,
    expected: {
      removeComment: true,
      replyText: /banned|bans|Banburgh|bannery/,
    },
  },
  {
    title: 'CommentSubmit - Leaves comment when on a different post',
    profile: testProfile,
    level: 0,
    comment: {
      ...fakeComment,
      postId: 't3_abcdef',
    },
    expected: {
      removeComment: false,
      replyText: false,
    },
  },
  {
    title: 'CommentSubmit - Removes comment when user is blocked',
    profile: {
      ...testProfile,
      blocked: new Date().toISOString(),
    },
    level: 0,
    comment: fakeComment,
    expected: {
      removeComment: true,
      replyText: /banned|bans|Banburgh|bannery/,
    },
  },
  {
    title: 'CommentSubmit - Removes comment when user has not verified email',
    profile: {
      ...testProfile,
      hasVerifiedEmail: false,
    },
    comment: fakeComment,
    level: 0,
    expected: {
      removeComment: true,
      replyText: 'You must first verify your email to play Field.',
    },
  },
  {
    title: 'CommentSubmit - Removes comment when user has won the game',
    profile: {
      ...testProfile,
      globalPointCount: 1,
    },
    comment: fakeComment,
    level: 0,
    expected: {
      removeComment: true,
      replyText: /banned|bans|Banburgh|bannery/,
    },
  },
]

for (const testCase of testCases) {
  DevvitTest.it(testCase.title, async ctx => {
    // Needed because we are testing global redis
    await DevvitTest.resetRedis()

    await userSet({
      redis: ctx.redis,
      user: testCase.profile,
    })

    const levels = config2.levels
    ctx.subredditId = levels[testCase.level]!.subredditId
    ctx.subredditName = levels[testCase.level]!.subredditName

    const removeComment = vi.fn()
    // @ts-expect-error sorry, this isn't a real Comment.
    vi.spyOn(ctx.reddit, 'getCommentById').mockResolvedValue({
      remove: removeComment,
    })

    await commentSubmit.onEvent(
      {
        comment: testCase.comment,
        author: fakeAuthor,
      },
      ctx,
    )

    if (testCase.expected.removeComment) {
      expect(removeComment).toHaveBeenCalledWith(false)
    } else {
      expect(removeComment).not.toHaveBeenCalled()
    }

    if (typeof testCase.expected.replyText !== 'boolean') {
      expect(ctx.reddit.submitComment).toHaveBeenCalledWith({
        id: fakeComment.id,
        text: expect.stringMatching(testCase.expected.replyText),
      })
    } else {
      expect(ctx.reddit.submitComment).not.toHaveBeenCalled()
    }
  })
}
