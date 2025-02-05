import {type MockInstance, vi} from 'vitest'

/**
 * Transform each function property into a Vitest MockInstance,
 * preserving parameter and return types by building a single function type.
 */
export type MockedClass<T> = {
  [K in keyof T]: T[K] extends (...args: infer A) => infer R
    ? MockInstance<(...args: A) => R>
    : T[K]
}

/**
 * Auto-mock all *methods* (functions) on the prototype of a given class `ClassType`.
 * Any time you instantiate that class in your tests, calls to those methods
 * will go through Vitest spies.
 */

// biome-ignore lint/suspicious/noExplicitAny: <explanation>
export function mockClass<T extends abstract new (...args: any[]) => any>(
  ClassType: T,
): MockedClass<InstanceType<T>> {
  const prototype = ClassType.prototype

  // Collect all "own" properties on the prototype that are functions
  const propertyNames = Object.getOwnPropertyNames(prototype).filter(
    prop => prop !== 'constructor' && typeof prototype[prop] === 'function',
  )

  // We'll track the spies in a plain object
  const mocks = {} as MockedClass<InstanceType<T>>

  for (const methodName of propertyNames) {
    // Create a spy on the prototype method
    // Casting here so TS knows it’s a SpyInstance<Parameters<T[K]>, ReturnType<T[K]>>
    mocks[methodName as keyof InstanceType<T>] = vi.spyOn(
      prototype,
      methodName,
    ) as unknown as MockedClass<InstanceType<T>>[typeof methodName]
  }

  return mocks
}
