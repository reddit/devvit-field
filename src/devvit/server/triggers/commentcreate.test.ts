import type {CommentV2} from '@devvit/protos/types/devvit/reddit/v2alpha/commentv2'
import type {UserV2} from '@devvit/protos/types/devvit/reddit/v2alpha/userv2'
import {expect, vi} from 'vitest'
import type {Profile} from '../../../shared/save'
import {USER_IDS} from '../../../shared/test-utils'
import {config2} from '../../../shared/types/level'
import {DevvitTest} from '../core/_utils/DevvitTest'
import {userSet} from '../core/user'
import {commentCreate} from './commentcreate'

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
  postId: 'postId',
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

const levels = config2.levels

const testCases = [
  {
    title: 'CommentCreate - Leaves comment when user is on right level',
    profile: testProfile,
    level: 1,
    expected: {
      removeComment: false,
      privateMessageText: false,
    },
  },
  {
    title: 'CommentCreate - Leaves comment alone when user is superuser',
    profile: {
      ...testProfile,
      superuser: true,
    },
    level: 0,
    expected: {
      removeComment: false,
      privateMessageText: false,
    },
  },
  {
    title: 'CommentCreate - Removes comment when user is on wrong level',
    profile: testProfile,
    level: 0,
    expected: {
      removeComment: true,
      privateMessageText: `Hi u/userFoo, your comment in r/${levels[0]!.subredditName} was removed, because you have been permanently banned from r/${levels[0]!.subredditName}.`,
    },
  },
  {
    title: 'CommentCreate - Removes comment when user is blocked',
    profile: {
      ...testProfile,
      blocked: new Date().toISOString(),
    },
    level: 0,
    expected: {
      removeComment: true,
      privateMessageText: `Hi u/userFoo, your comment in r/${levels[0]!.subredditName} was removed, because you have been banned from playing Field.`,
    },
  },
  {
    title: 'CommentCreate - Removes comment when user has not verified email',
    profile: {
      ...testProfile,
      hasVerifiedEmail: false,
    },
    level: 0,
    expected: {
      removeComment: true,
      privateMessageText: `Hi u/userFoo, your comment in r/${levels[0]!.subredditName} was removed, because you must first verify your email to play Field.`,
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

    await commentCreate.onEvent(
      {
        comment: fakeComment,
        author: fakeAuthor,
      },
      ctx,
    )

    if (testCase.expected.removeComment) {
      expect(removeComment).toHaveBeenCalledWith(false)
    } else {
      expect(removeComment).not.toHaveBeenCalled()
    }

    if (testCase.expected.privateMessageText) {
      expect(ctx.reddit.sendPrivateMessage).toHaveBeenCalledWith({
        to: 'userFoo',
        subject: 'Your comment was removed from Field',
        text: testCase.expected.privateMessageText,
      })
    } else {
      expect(ctx.reddit.sendPrivateMessage).not.toHaveBeenCalled()
    }
  })
}
