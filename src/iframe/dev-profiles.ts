import {devMode} from '../shared/dev-mode.ts'
import type {Profile} from '../shared/save.ts'

export const devProfiles: readonly Readonly<Profile>[] = devMode
  ? [
      {t2: 't2_mdn67zkp', username: 'cedaraspen'},
      {t2: 't2_vw5x123d', username: 'ChatGPTTookMyJob'},
      {t2: 't2_t1mxkn9d', username: 'FlyingLaserTurtle'},
      {t2: 't2_reyi3nllt', username: 'likeoid'},
      {t2: 't2_1bgenlvxgq', username: 'Minimum_Solid7428'},
      {t2: 't2_uxu53cio', username: 'neuralspikes'},
      {t2: 't2_7u315kgs', username: 'Oppdager'},
      {t2: 't2_hbbuxlhe5', username: 'pizzaoid'},
      {t2: 't2_k6ldbjh3', username: 'stephenoid'},
      {t2: 't2_3kh50', username: 'youngluck'},
    ]
  : []
