export type ParsedDevvitUserAgent =
  | {
      company: 'Reddit'
      platform: 'iOS'
      rawVersion: string
      versionNumber: number
    }
  | {
      company: 'Reddit'
      platform: 'Android'
      rawVersion: string
      versionNumber: number
    }
  | {
      company: 'Reddit'
      platform: 'Shreddit'
      rawVersion: string
    }
  | {
      company: 'Reddit'
      platform: 'Play'
      rawVersion: string
    }

const getVersionNumberFromRawVersion = (
  rawVersion: string,
): number | undefined => {
  const versionNumber = Number(rawVersion.trim().split('.').pop())
  return Number.isNaN(versionNumber) ? undefined : versionNumber
}

export const parseDevvitUserAgent = (
  input: string,
): ParsedDevvitUserAgent | undefined => {
  const [company, platform, rawVersion] = input.trim().split(';')

  if (!company || !platform || !rawVersion) {
    console.warn(`Received a malformed devvit-user-agent! Received: '${input}'`)
    return
  }

  if (company !== 'Reddit') {
    console.warn(
      `Received unknown company name in user agent! Received: '${input}'`,
    )
    return
  }

  if (platform === 'iOS') {
    const versionNumber = getVersionNumberFromRawVersion(rawVersion)

    if (versionNumber === undefined) {
      console.warn(
        `Could not parse version number from user agent! Received: '${input}'`,
      )
      return
    }

    return {
      company: 'Reddit',
      platform: 'iOS',
      rawVersion,
      versionNumber,
    }
  }

  if (platform === 'Android') {
    const versionNumber = getVersionNumberFromRawVersion(rawVersion)

    if (versionNumber === undefined) {
      console.warn(
        `Could not parse version number from user agent! Received: '${input}'`,
      )
      return
    }

    return {
      company: 'Reddit',
      platform: 'Android',
      rawVersion,
      versionNumber,
    }
  }

  if (platform === 'Shreddit') {
    return {
      company: 'Reddit',
      platform: 'Shreddit',
      rawVersion,
    }
  }

  if (platform === 'Play') {
    return {
      company: 'Reddit',
      platform: 'Play',
      rawVersion,
    }
  }

  console.warn('Received unknown platform:', platform)
}

export const shouldShowUpgradeAppScreen = (
  parsedDevvitUserAgent: ParsedDevvitUserAgent | undefined,
): boolean => {
  // If we couldn't parse, default to trying to render the app
  if (!parsedDevvitUserAgent) {
    console.warn(
      `Could not parse devvit-user-agent! Received: '${JSON.stringify(parsedDevvitUserAgent)}'`,
    )
    return false
  }

  if (parsedDevvitUserAgent.platform === 'Android') {
    // TODO: Version number
    return parsedDevvitUserAgent.versionNumber < 1875012
  }

  if (parsedDevvitUserAgent.platform === 'iOS') {
    // TODO: Version number
    return parsedDevvitUserAgent.versionNumber < 616020
  }

  // Default to trying to render since we couldn't explicitly get the version number
  return false
}

export const getUpgradeLinkForPlatform = (
  platform: ParsedDevvitUserAgent['platform'],
): string | undefined => {
  switch (platform) {
    case 'Android':
      return 'https://play.google.com/store/apps/details?id=com.reddit.frontpage'
    case 'iOS':
      return 'https://apps.apple.com/us/app/reddit/id1064216828'
    case 'Play':
    case 'Shreddit':
      break
    default:
      console.error(`No upgrade link for platform: ${platform satisfies never}`)
  }
}
