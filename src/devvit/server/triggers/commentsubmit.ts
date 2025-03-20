import {type CommentSubmitDefinition, Devvit} from '@devvit/public-api'
import {asT2ID} from '@devvit/shared-types/tid.js'
import {config2} from '../../../shared/types/level.js'
import {userMaybeGet} from '../core/user.js'

export const commentSubmit: CommentSubmitDefinition = {
  event: 'CommentSubmit',
  onEvent: async (event, ctx) => {
    if (!event.comment || !event.author) return

    // Kill-switch to disable this trigger
    if ((await ctx.settings.get<string>('skip-comment-create')) === 'true')
      return

    const authorId = event.author.id
    const profile = await userMaybeGet({
      redis: ctx.redis,
      userId: asT2ID(authorId),
    })

    // Mods/admins/app can always comment
    if (profile?.superuser || event.author.name === ctx.appName) {
      return
    }

    const subredditLevel = config2.levels.find(
      x => x.subredditId === ctx.subredditId,
    )
    if (!subredditLevel) {
      throw new Error(
        `No level config found for subreddit ${ctx.subredditId}. Please make sure you are using the right config.{env}.json (or update it for the new sub you installed this app to)!`,
      )
    }

    let reason = ''
    if (!profile) {
      reason = 'you must play the game before you can comment.'
    } else if (profile.blocked) {
      reason = 'you have been banned from playing Field.'
    } else if (profile.hasVerifiedEmail === false) {
      reason = 'you must first verify your email to play Field.'
    } else if (profile.currentLevel !== subredditLevel.id) {
      reason = `you have been permanently banned from r/${subredditLevel.subredditName}.`
    } else {
      // Only delete the comment if we came up with a reason to do so
      return
    }

    const messageTemplate = `Your comment in r/${ctx.subredditName} was removed, because ${reason}`

    const comment = await ctx.reddit.getCommentById(event.comment.id)
    await Promise.all([
      comment.remove(false),
      ctx.reddit.submitComment({
        id: event.comment.id,
        text: messageTemplate,
      }),
    ])
  },
}

Devvit.addTrigger(commentSubmit)
