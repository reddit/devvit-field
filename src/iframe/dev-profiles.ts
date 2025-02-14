import type {Profile} from '../shared/save.ts'

export const devProfiles: readonly Readonly<Profile>[] = devMode
  ? [
      {t2: 't2_mdn67zkp', username: 'cedaraspen', superuser: true},
      {t2: 't2_vw5x123d', username: 'ChatGPTTookMyJob', superuser: true},
      {t2: 't2_t1mxkn9d', username: 'FlyingLaserTurtle', superuser: true},
      {t2: 't2_reyi3nllt', username: 'likeoid', superuser: true},
      {t2: 't2_1bgenlvxgq', username: 'Minimum_Solid7428', superuser: true},
      {t2: 't2_uxu53cio', username: 'neuralspikes', superuser: true},
      {t2: 't2_7u315kgs', username: 'Oppdager', superuser: true},
      {t2: 't2_hbbuxlhe5', username: 'pizzaoid', superuser: true},
      {t2: 't2_k6ldbjh3', username: 'stephenoid', superuser: true},
      {t2: 't2_3kh50', username: 'youngluck', superuser: true},
    ]
  : []
