import {type CommentSubmitDefinition, Devvit} from '@devvit/public-api'
import {asT2ID} from '@devvit/shared-types/tid.js'
import {config2} from '../../../shared/types/level.js'
import {userMaybeGet} from '../core/user.js'

const COMMENT_REASONS = [
  'was banned into oblivion.',
  'got a swift ban in the bannery.',
  'clicked around and found out (got banned).',
  'was banned and we hope they feel banned.',
  'found a ban box and boy howdy did they get banned.',
  'bought a one-way ticket to Banburgh.',
  'got banned. We all saw that coming.',
  'got banned and the world moved on.',
  'got banned and nobody noticed.',
  "was here to click boxes and avoid bans, and they're all out of avoiding bans.",
  "is banned, violets are blue. This is a poem, it's not a haiku.",
  'got banned. Tell a friend!',
  "got banned... or never existed? Who's to say?",
]

export const commentSubmit: CommentSubmitDefinition = {
  event: 'CommentSubmit',
  onEvent: async (event, ctx) => {
    if (!event.comment || !event.author) return

    // Kill-switch to disable this trigger
    if ((await ctx.settings.get<string>('skip-comment-create')) === 'true')
      return

    const subredditLevel = config2.levels.find(
      x => x.subredditId === ctx.subredditId,
    )
    if (!subredditLevel) {
      throw new Error(
        `No level config found for subreddit ${ctx.subredditId}. Please make sure you are using the right config.{env}.json (or update it for the new sub you installed this app to)!`,
      )
    }

    // Only apply comment deletion logic if the comment is on one of the game posts.
    if (subredditLevel.postId !== event.comment.postId) return

    const authorId = event.author.id
    const profile = await userMaybeGet({
      redis: ctx.redis,
      userId: asT2ID(authorId),
    })

    // Mods/admins/app can always comment
    if (profile?.superuser || event.author.name === ctx.appName) {
      return
    }

    let message = ''
    if (!profile) {
      message = 'You must play the game before you can comment.'
    } else if (profile.hasVerifiedEmail === false) {
      message = 'You must first verify your email to play Field.'
    } else if (
      profile.blocked ||
      profile.globalPointCount > 0 ||
      profile.currentLevel !== subredditLevel.id
    ) {
      // For most "banned" cases, pick one of the fun messages.
      message = `u/${profile.username} ${COMMENT_REASONS[Math.floor(Math.random() * COMMENT_REASONS.length)]}`
    } else {
      // Only delete the comment if we came up with a reason to do so
      return
    }

    const comment = await ctx.reddit.getCommentById(event.comment.id)
    await Promise.all([
      comment.remove(false),
      ctx.reddit.submitComment({
        id: event.comment.id,
        text: message,
      }),
    ])
  },
}

Devvit.addTrigger(commentSubmit)
