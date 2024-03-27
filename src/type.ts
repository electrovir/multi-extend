import {Overwrite} from '@augment-vir/common';
import {Constructor, Simplify} from 'type-fest';

/** Removes the first entry in a tuple type. */
export type RemoveFirstTupleEntry<T extends ReadonlyArray<unknown>> = T extends [
    firstArg: unknown,
    ...theRest: infer TheRest,
]
    ? TheRest
    : never;

/** One by one overwrites each type with each subsequent type. */
export type OverwriteChain<Inputs extends any[]> = Inputs extends [any]
    ? Omit<Simplify<Inputs[0]>, 'prototype'>
    : Overwrite<
          Omit<Simplify<Inputs[0]>, 'prototype'>,
          OverwriteChain<RemoveFirstTupleEntry<Inputs>>
      >;

/** Maps an array of constructors to an array of their instance types. */
export type ToInstanceTypes<Constructors extends Constructor<any>[]> = {
    [Index in keyof Constructors]: InstanceType<Constructors[Index]>;
};
