import type {Config} from '../types/config.ts'
import config from './config.json' with {type: 'json'}

config satisfies Config

export type Tag = keyof typeof config.tags
