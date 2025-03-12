import {
  PutObjectCommand,
  type PutObjectCommandInput,
  type PutObjectCommandOutput,
  S3Client,
} from '@aws-sdk/client-s3'
import type {SettingsClient} from '@devvit/public-api'
import type {StreamingBlobPayloadInputTypes} from '@smithy/types'

export type ClientOptions = {
  's3-region': string
  's3-bucket': string
  'aws-access-key': string
  'aws-secret': string
}

export type UploadOptions = {
  contentType: string
  path: string
  body: StreamingBlobPayloadInputTypes
}

export class Client {
  readonly #client: S3Client
  readonly #bucket: string

  constructor(settings: ClientOptions) {
    const region = settings['s3-region'] as string
    const accessKeyId = settings['aws-access-key'] as string
    const secretAccessKey = settings['aws-secret'] as string
    this.#client = new S3Client({
      region,
      credentials: {accessKeyId, secretAccessKey},
    })
    this.#bucket = settings['s3-bucket'] as string
  }

  async send(opts: UploadOptions): Promise<PutObjectCommandOutput> {
    const inp: PutObjectCommandInput = {
      Bucket: this.#bucket,
      Key: opts.path,
      Body: opts.body,
      ContentType: opts.contentType,
    }
    return this.#client.send(new PutObjectCommand(inp))
  }
}

export async function getPathPrefix(settings: SettingsClient): Promise<string> {
  const pathPrefix = await settings.get<string>('s3-path-prefix')
  if (!pathPrefix) {
    throw new Error('s3-path-prefix not configured in settings')
  }

  // Remove any trailing '/' from the path prefix, since we're requiring the
  return pathPrefix.replace(/^\/*(.*?)\/*$/, 'platform/a1/$1')
}
