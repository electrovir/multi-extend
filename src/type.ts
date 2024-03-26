import {Overwrite} from '@augment-vir/common';
import {Constructor} from 'type-fest';

/** One by one overwrites each type with each subsequent type. */
export type OverwriteChain<Inputs extends any[]> = Inputs extends [
    infer FirstParam,
    ...infer RestParams,
]
    ? Overwrite<FirstParam, OverwriteChain<RestParams>>
    : Inputs extends [infer FirstParam]
      ? FirstParam
      : {};

/** Maps an array of constructors to an array of their instance types. */
export type ToInstanceTypes<Constructors extends Constructor<any>[]> = {
    [Index in keyof Constructors]: InstanceType<Constructors[Index]>;
};
