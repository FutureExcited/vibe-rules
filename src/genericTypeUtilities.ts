/**
 * Generic TypeScript utility types for compile-time validation and assertions
 */

/**
 * Get the distributive intersection of two types
 */
export type Intersection<T, U> = T extends any ? U extends any ? U & T : never : never;

/**
 * Get the union of two types
 */
export type Union<T, U> = T | U;

/**
 * Assert that a type is empty (never)
 * Usage: const _check: AssertIsEmpty<SomeType> = true;
 */
export type AssertIsEmpty<T> = [T] extends [never] 
  ? true 
  : {
      ERROR: "Expected type to be empty (never), but it contains values";
      ACTUAL_TYPE: T;
    };

/**
 * Assert that two types are exactly equal
 * Usage: const _check: AssertAreEqual<TypeA, TypeB> = true;
 */
export type AssertAreEqual<T, U> = [T] extends [U]
  ? [U] extends [T]
    ? true
    : {
        ERROR: "Types are not equal - second type is missing values from first";
        FIRST_TYPE: T;
        SECOND_TYPE: U;
        MISSING_FROM_SECOND: Exclude<T, U>;
      }
  : {
      ERROR: "Types are not equal - first type is missing values from second";
      FIRST_TYPE: T;
      SECOND_TYPE: U;
      MISSING_FROM_FIRST: Exclude<U, T>;
    };

/**
 * Get the intersection of two array types (as union types)
 * Useful for checking overlap between const arrays
 * Returns never if there's no overlap, or the overlapping values if there is
 */
export type ArrayIntersection<T extends readonly unknown[], U extends readonly unknown[]> = 
  Extract<T[number], U[number]>;

/**
 * Get the union of two array types (as union types)
 * Useful for combining const arrays into a single union type
 */
export type ArrayUnion<T extends readonly unknown[], U extends readonly unknown[]> = 
  T[number] | U[number]; 