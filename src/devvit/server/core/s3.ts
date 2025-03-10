import {
  PutObjectCommand,
  type PutObjectCommandInput,
  type PutObjectCommandOutput,
  S3Client,
} from '@aws-sdk/client-s3'
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
