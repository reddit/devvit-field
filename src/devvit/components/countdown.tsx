// biome-ignore lint/style/useImportType: <explanation>
import {Devvit, useInterval} from '@devvit/public-api'
import {useState2} from '../hooks/use-state2.ts'

export type CountdownProps = {loaded: boolean; teamScores: number[]}

// Helper function to calculate time remaining
const getTimeRemaining = () => {
  const now = new Date().getTime()
  const targetDate = new Date('April 1, 2025 00:00:00').getTime()
  const difference = targetDate - now

  if (difference <= 0) {
    return {days: 0, hours: 0, minutes: 0, seconds: 0}
  }

  const days = Math.floor(difference / (1000 * 60 * 60 * 24))
  const hours = Math.floor(
    (difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60),
  )
  const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60))
  const seconds = Math.floor((difference % (1000 * 60)) / 1000)

  return {days, hours, minutes, seconds}
}

const ONE_HOUR = 60 * 60 * 1000

export const Countdown: Devvit.BlockComponent = (_, _ctx) => {
  const [timeRemaining, setTimeRemaining] = useState2(getTimeRemaining())
  const updateState = () => {
    const newValue = getTimeRemaining()
    setTimeRemaining(newValue)
  }
  useInterval(updateState, ONE_HOUR).start()
  return (
    <blocks>
      <zstack
        alignment='middle center'
        backgroundColor='white'
        width='100%'
        height='100%'
      >
        <hstack>
          <text size='xlarge' alignment='center' weight='bold' color='black'>
            {timeRemaining.days}
          </text>
          <spacer size='small' />
          <text size='xlarge' alignment='center' weight='bold' color='black'>
            days
          </text>
          <spacer size='small' />
          <text size='xlarge' alignment='center' weight='bold' color='black'>
            {timeRemaining.hours}
          </text>
          <spacer size='small' />
          <text size='xlarge' alignment='center' weight='bold' color='black'>
            hours
          </text>
        </hstack>
      </zstack>
    </blocks>
  )
}
