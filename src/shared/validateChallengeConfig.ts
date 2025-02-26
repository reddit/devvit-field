import type {
  ChallengeConfig,
  DefaultChallengeConfig,
} from './types/challenge-config'

/**
 * Validates challenge configuration parameters
 *
 * @param config The challenge configuration to validate
 * @throws Error if any validation rule fails
 */
export function validateChallengeConfig(
  config: ChallengeConfig | DefaultChallengeConfig,
): void {
  console.log('config.size', config.size, typeof config.size)
  console.log(
    'config.partitionSize',
    config.partitionSize,
    typeof config.partitionSize,
  )
  console.log(
    'config.mineDensity',
    config.mineDensity,
    typeof config.mineDensity,
  )
  if (
    !Number.isInteger(config.size) ||
    !Number.isInteger(config.partitionSize) ||
    !Number.isInteger(config.mineDensity)
  ) {
    throw new Error('Size, partitionSize, and mineDensity must be integers')
  }

  if (config.size < 2) {
    throw new Error('Size must be greater than 1')
  }

  if (config.partitionSize < 1) {
    throw new Error('Partition size must be greater than 0')
  }

  if (config.partitionSize > config.size) {
    throw new Error('Partition size must be less than or equal to size')
  }

  if (config.mineDensity < 0 || config.mineDensity > 100) {
    throw new Error('Mine density must be between 0 and 100')
  }

  if (config.size % config.partitionSize !== 0) {
    throw new Error(
      `Size ${config.size} must be divisible by partitionSize ${config.partitionSize}`,
    )
  }
}
