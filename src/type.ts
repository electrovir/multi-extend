import {Overwrite} from '@augment-vir/common';
import {Constructor} from 'type-fest';

/** Removes the first entry in a tuple type. */
export type RemoveFirstTupleEntry<T extends ReadonlyArray<unknown>> = T extends [
    firstArg: unknown,
    ...theRest: infer TheRest,
]
    ? TheRest
    : never;

/** One by one overwrites each type with each subsequent type. */
export type OverwriteChain<Inputs extends any[]> = Inputs extends [any, any]
    ? Overwrite<Inputs[0], Inputs[1]>
    : Inputs extends [any]
      ? Inputs[0]
      : Overwrite<Inputs[0], OverwriteChain<RemoveFirstTupleEntry<Inputs>>>;

/** Maps an array of constructors to an array of their instance types. */
export type ToInstanceTypes<Constructors extends Constructor<any>[]> = {
    [Index in keyof Constructors]: InstanceType<Constructors[Index]>;
};
