import {ArrayElement, Overwrite} from '@augment-vir/common';
import {Constructor} from 'type-fest';
import {OverwriteChain, ToInstanceTypes} from './type';

/** An instance created by `multiExtend. */
export type MultiExtended<Constructors extends Constructor<any>[]> = OverwriteChain<
    ToInstanceTypes<Constructors>
>;

/** The constructor created by `multiExtend`. */
export type MultiExtendedConstructor<Constructors extends Constructor<any>[]> = Overwrite<
    OverwriteChain<Constructors>,
    {
        new (...params: AllConstructorParameters<Constructors>): MultiExtended<Constructors>;
    }
>;

/**
 * Map an array of constructors to their constructor parameters. Any constructors without any
 * parameters are mapped to `undefined`.
 */
export type ConstructorParams<Constructors extends Constructor<any>[]> = {
    [Index in keyof Constructors]: ConstructorParameters<Constructors[Index]> extends []
        ? undefined
        : ConstructorParameters<Constructors[Index]>;
};

/**
 * Flattens all constructor parameters to an empty array if none of them exist, so you can call a
 * constructor with no arguments when no are expected.
 */
export type AllConstructorParameters<Constructors extends Constructor<any>[]> =
    Exclude<ArrayElement<ConstructorParams<Constructors>>, undefined> extends never
        ? []
        : ConstructorParams<Constructors>;

/**
 * Creates a class constructor that combines multiple class constructors and can be extended.
 *
 * @category Main
 * @example
 *     export class MyClass extends multiExtend(RegExp, URL) {
 *         constructor() {
 *             super(['w+'], ['https://example.com']);
 *         }
 *     }
 */
export function multiExtend<const Constructors extends Constructor<any>[]>(
    ...classConstructors: Constructors
): MultiExtendedConstructor<Constructors> {
    const baseClass = class {};
    const allParents = [
        baseClass,
        ...[...classConstructors].reverse(),
    ];

    function findParentWithProperty(property: PropertyKey) {
        return allParents.find((parent) => Reflect.has(parent, property)) || baseClass;
    }

    function construct(
        target: typeof baseClass,
        constructionParams: AllConstructorParameters<Constructors>,
    ) {
        const baseInstance = new baseClass();

        const parentInstances = classConstructors
            .map((classConstructor, index) => {
                const params = constructionParams[index] || [];
                return new classConstructor(...params);
            })
            .reverse();

        const allInstances = [
            baseInstance,
            ...parentInstances,
        ];

        function findInstanceWithProperty(property: PropertyKey) {
            return allInstances.find((parent) => Reflect.has(parent, property)) || baseInstance;
        }

        const instanceProxy: any = new Proxy(baseInstance, {
            defineProperty(target, property, attributes) {
                const parent = findInstanceWithProperty(property);
                return Reflect.defineProperty(parent, property, attributes);
            },
            deleteProperty(target, property) {
                const parent = findInstanceWithProperty(property);
                return Reflect.deleteProperty(parent, property);
            },
            getOwnPropertyDescriptor(target, property) {
                const parent = findInstanceWithProperty(property);
                return Reflect.getOwnPropertyDescriptor(parent, property);
            },
            has(target, property) {
                const parent = findInstanceWithProperty(property);
                return Reflect.has(parent, property);
            },
            isExtensible() {
                return Reflect.isExtensible(baseInstance);
            },
            ownKeys() {
                const allKeys = allInstances.flatMap((parent) => {
                    return Reflect.ownKeys(parent);
                });
                return Array.from(new Set(allKeys)).sort((a, b) => {
                    return String(a).localeCompare(String(b));
                });
            },
            preventExtensions() {
                return Reflect.preventExtensions(baseInstance);
            },
            set(target, property, value) {
                const parent = findInstanceWithProperty(property);
                return Reflect.set(parent, property, value);
            },
            setPrototypeOf(target, value) {
                return Reflect.setPrototypeOf(baseInstance, value);
            },
            get(target, property) {
                if (property === 'prototype') {
                    return (baseInstance as any).prototype;
                } else if (property === 'constructor') {
                    return combinedConstructors;
                }

                const parent = findInstanceWithProperty(property);
                return Reflect.get(parent, property);
            },
            getPrototypeOf() {
                return Reflect.getPrototypeOf(baseInstance);
            },
        });

        return instanceProxy;
    }

    const combinedConstructors = new Proxy(baseClass, {
        defineProperty(target, property, attributes) {
            const parent = findParentWithProperty(property);
            return Reflect.defineProperty(parent, property, attributes);
        },
        deleteProperty(target, property) {
            const parent = findParentWithProperty(property);
            return Reflect.deleteProperty(parent, property);
        },
        getOwnPropertyDescriptor(target, property) {
            const parent = findParentWithProperty(property);
            return Reflect.getOwnPropertyDescriptor(parent, property);
        },
        has(target, property) {
            const parent = findParentWithProperty(property);
            return Reflect.has(parent, property);
        },
        isExtensible() {
            return Reflect.isExtensible(baseClass);
        },
        ownKeys() {
            const allKeys = allParents.flatMap((parent) => Reflect.ownKeys(parent));
            return Array.from(new Set(allKeys)).sort((a, b) => {
                return String(a).localeCompare(String(b));
            });
        },
        preventExtensions() {
            return Reflect.preventExtensions(baseClass);
        },
        set(target, property, value) {
            const parent = findParentWithProperty(property);
            return Reflect.set(parent, property, value);
        },
        setPrototypeOf(target, value) {
            return Reflect.setPrototypeOf(baseClass, value);
        },
        construct,
        get(target, property) {
            if (property === 'prototype') {
                return baseClass.prototype;
            } else if (property === 'constructor') {
                return construct;
            }

            const parent = findParentWithProperty(property);
            return Reflect.get(parent, property);
        },
        getPrototypeOf(target) {
            return Reflect.getPrototypeOf(baseClass);
        },
    });

    return combinedConstructors as MultiExtendedConstructor<Constructors>;
}
