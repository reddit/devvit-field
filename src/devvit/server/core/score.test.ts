import {expect, it} from 'vitest'
import {type ComputeScoreResponse, computeScore} from './score'

it('score should return 0 if no scores', () => {
  expect(
    computeScore({
      size: 2,
      teams: [
        {member: 3, score: 0},
        {member: 2, score: 0},
        {member: 1, score: 0},
        {member: 0, score: 0},
      ],
      startTimeMs: 0,
    }),
  ).toStrictEqual({
    isOver: false,
    remainingPercentage: 100,
    winner: undefined,
    claimsPerSecond: 0,
  } satisfies ComputeScoreResponse)
})

it('does not require teams to be provided in order', () => {
  expect(
    computeScore({
      size: 2,
      teams: [
        {member: 2, score: 0},
        {member: 0, score: 0},
        {member: 3, score: 3},
        {member: 1, score: 0},
      ],
      startTimeMs: 0,
    }),
  ).toStrictEqual({
    isOver: true,
    remainingPercentage: 25,
    winner: 3,
    claimsPerSecond: 0.1,
  } satisfies ComputeScoreResponse)
})

it('score declare winner when no one can pass the person in the lead', () => {
  expect(
    computeScore({
      size: 2,
      teams: [
        {member: 3, score: 3},
        {member: 2, score: 0},
        {member: 1, score: 0},
        {member: 0, score: 0},
      ],
      startTimeMs: 0,
    }),
  ).toStrictEqual({
    isOver: true,
    remainingPercentage: 25,
    winner: 3,
    claimsPerSecond: 0.1,
  } satisfies ComputeScoreResponse)
})

it('score does not blow up on a tie and chooses someone', () => {
  expect(
    computeScore({
      size: 2,
      teams: [
        {member: 3, score: 2},
        {member: 2, score: 2},
        {member: 1, score: 0},
        {member: 0, score: 0},
      ],
      startTimeMs: 0,
    }),
  ).toStrictEqual({
    isOver: true,
    remainingPercentage: 0,
    winner: expect.any(Number),
    claimsPerSecond: 4 / 30,
  } satisfies ComputeScoreResponse)
})
