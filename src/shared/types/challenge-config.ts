import type {Seed} from './random'

export type DefaultChallengeConfig = Pick<
  ChallengeConfig,
  'size' | 'partitionSize' | 'mineDensity'
>

export type ChallengeConfig = {
  /** The length of a side of the field. We assume it is always a perfect square. */
  size: number
  /**
   * The length of a size of a partition. Must be perfectly divisible into the size of the field.
   *
   * Set the partition size to the same number as the size to have no partition.
   */
  partitionSize: number
  /**
   * DO NOT EXPOSE THIS TO THE CLIENT. THIS IS BACKEND ONLY!!
   *
   * A random number that determines key aspects of the game like which cells are mines.
   */
  seed: Seed
  /**
   * DO NOT EXPOSE THIS TO THE CLIENT. THIS IS BACKEND ONLY!!
   *
   * Number between 0 and 100.
   *
   * 0: No mines
   * 100: Only mines
   *
   * Why an int over a float? Because things like incrBy are only for ints. At the moment,
   * I don't think we want to dynamically change the density of the field, but who's to
   * say it wouldn't be a fun feature if needed.
   */
  mineDensity: number

  totalNumberOfMines: number

  // TODO: Theme variables and other config that we want to change per sub?

  // TODO: Add a debug flag here
}

export const defaultChallengeConfigKey = 'default_challenge_config'
export const currentChallengeNumberKey = 'current_challenge_number'
export const createChallengeConfigKey = (
  challengeNumber: number,
): `challenge:${number}:config` =>
  `challenge:${challengeNumber}:config` as const
