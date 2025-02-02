import {
  type Context,
  Devvit,
  type JobContext,
  type Post,
  type RedditAPIClient,
} from '@devvit/public-api'
import type {PostSeed, Profile} from '../shared/save.ts'
import {type T2, noUsername} from '../shared/types/tid.ts'
import {Preview} from './components/preview.tsx'

Devvit.configure({redditAPI: true})

/** create a new post as the viewer. */
export async function r2CreatePost(
  ctx: Context | JobContext,
  _seed: Readonly<PostSeed>, // to-do: fix me.
  username: string,
): Promise<Post> {
  if (!ctx.subredditName) throw Error('no sub name')

  // to-do: fix me.
  const field = 3

  const post = await ctx.reddit.submitPost({
    preview: <Preview />,
    subredditName: ctx.subredditName,
    title: `Banfield #${field}`,
  })

  console.log(`post #${field} by ${username}`)

  return post
}

export async function r2QueryProfile(
  r2: RedditAPIClient,
  t2: T2,
): Promise<Profile> {
  const user = await r2.getUserById(t2)
  return {t2, username: user?.username ?? noUsername}
}
