import {Devvit, type ScheduledJobHandler} from '@devvit/public-api'

export const onRun: ScheduledJobHandler<{challengeNumber: number}> = async (
  {data},
  _ctx,
): Promise<void> => {
  if (data.challengeNumber == null) {
    throw new Error('No challenge number provided')
  }

  // TODO: First thing is to make sure that the challenge is still active since the job could be
  // ran multiple times. Maybe even write at the start or put a lock somewhere.

  // challenge is over!
  console.log(
    `Challenge is over, devs do something! Challenge number: ${data.challengeNumber}`,
  )
}

Devvit.addSchedulerJob({
  name: 'ON_CHALLENGE_END',
  onRun,
})
