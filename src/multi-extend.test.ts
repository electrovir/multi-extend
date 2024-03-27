import {assert} from '@open-wc/testing';
import {
    assertDefined,
    assertInstanceOf,
    assertRunTimeType,
    assertTypeOf,
} from 'run-time-assertions';
import {Constructor} from 'type-fest';
import {ListenTarget} from 'typed-event-target';
import {
    AllConstructorParameters,
    MultiExtended,
    MultiExtendedConstructor,
    multiExtend,
} from './multi-extend';

describe('MultiExtended', () => {
    it('can use the RegExp constructor', () => {
        assertTypeOf(RegExp).toMatchTypeOf<Constructor<any>>();
    });

    it('overwrites with subsequent members', () => {
        assertTypeOf<
            MultiExtended<[{new (): {prop: number}}, {new (): {prop: string}}]>['prop']
        >().toEqualTypeOf<string>();
    });
});

describe('MultiExtendedConstructor', () => {
    it('is a constructor', () => {
        assertTypeOf<
            MultiExtendedConstructor<[{new (): {prop: number}}, {new (): {prop: string}}]>
        >().toMatchTypeOf<Constructor<any>>();
        assertTypeOf<
            MultiExtendedConstructor<[{new (): {prop: number}}, {new (): {prop: string}}]>
        >().toMatchTypeOf<{new (): {prop: string}}>();
    });
});

describe('AllConstructorParameters', () => {
    it('omits parameters when none are required', () => {
        assertTypeOf<
            AllConstructorParameters<[{new (): {prop: number}}, {new (): {prop: string}}]>
        >().toEqualTypeOf<[]>();
    });
});

describe(multiExtend.name, () => {
    it('works with double inheritance', () => {
        class ChildClass extends ListenTarget<Event> {}

        class GrandchildClass extends multiExtend(ChildClass) {}

        new GrandchildClass();
    });

    it('supports method overrides', () => {
        class ParentClass {
            public myMethod() {
                return 'hi';
            }
        }

        class ChildClass extends multiExtend(ParentClass) {
            public override myMethod() {
                return 'hi';
            }
        }
    });

    it('can extend multiple classes', () => {
        class A {
            public myMethod() {
                return 'hi';
            }
        }

        class B {
            public myMethod2() {
                return 32;
            }
        }

        class C {
            public myMethod3() {
                return 'hi';
            }
        }

        class D {
            public myMethod() {
                return 32;
            }
        }

        class E {
            public myMethod() {
                return 32;
            }
            public myMethod2() {
                return 'hi';
            }
        }

        class F {
            public myMethod() {
                return 32;
            }
        }

        class ChildClass extends multiExtend(A, B, C, D, E, F) {
            public override myMethod() {
                return 1;
            }

            /** Unfortunately you need to use arrow functions to override methods. */
            // @ts-expect-error
            public override myMethod2() {
                return 'hi 555';
            }
        }

        assert.strictEqual(new ChildClass().myMethod2(), 'hi 555');
    });

    class ParentClass {
        static superThing = 'some string';
        constructor(public instanceMember: number) {}
    }

    class ChildClass extends ParentClass {
        static childThing = 42;
        constructor(
            public instanceMember2: number,
            public instanceMember3: RegExp,
        ) {
            super(123);
        }
    }

    class AnotherClass {
        public result = 32;

        constructor(public greeting = 'hello') {}
    }

    class ExtendedClass extends multiExtend(ChildClass, URL, RegExp) {
        public override href = 'hi';
    }

    it('has correct types', () => {
        class SubClass extends multiExtend(RegExp, URL) {}

        const instance = new SubClass(['hi'], ['https://example.com']);

        assertTypeOf(instance.exec).toEqualTypeOf<RegExp['exec']>();
    });

    it('does not work with instanceof', () => {
        class SubClass extends multiExtend(ParentClass, AnotherClass) {}
        const instance = new SubClass([654], ['https://example.com']);

        assert.isFalse(instance instanceof URL);
    });

    it('works with super calls', () => {
        class SubClass extends multiExtend(ParentClass, URL) {
            constructor() {
                super([654], ['https://example.com']);
            }
        }
        const instance = new SubClass();

        assert.strictEqual(instance.href, 'https://example.com/');
    });

    it('copies static members', () => {
        class SubClass extends multiExtend(ParentClass, AnotherClass, URL) {}

        assertTypeOf(SubClass.canParse).toEqualTypeOf(URL.canParse);

        assert.strictEqual(SubClass.canParse, URL.canParse);
    });

    it('copies parent static members', () => {
        class ExtenderClass extends multiExtend(ChildClass, URL) {}

        assert.strictEqual(ExtenderClass.superThing, ParentClass.superThing);
        assert.strictEqual(ExtenderClass.childThing, ChildClass.childThing);
        assert.strictEqual(ExtenderClass.canParse, URL.canParse);

        const extenderInstance = new ExtenderClass(
            [
                32,
                /some regexp/,
            ],
            ['http://www.example.com'],
        );

        assertRunTimeType(extenderInstance.instanceMember, 'number');
        assertRunTimeType(extenderInstance.instanceMember2, 'number');
        assertInstanceOf(extenderInstance.instanceMember3, RegExp);
    });

    describe('instances', () => {
        function createTestInstance(
            params?: ConstructorParameters<typeof ExtendedClass> | undefined,
        ) {
            const instance = new ExtendedClass(
                ...(params || [
                    [
                        32,
                        /\d+/,
                    ],
                    ['https://www.example.com'],
                    ['\\w+'],
                ]),
            );
            return instance;
        }

        it('supports defineProperty', () => {
            const instance: any = createTestInstance();
            assert.isTrue(
                Reflect.defineProperty(instance, 'prop1', {
                    value: 'hi',
                }),
            );
            assert.strictEqual(instance.prop1, 'hi');
        });

        it('supports deleteProperty', () => {
            const instance = createTestInstance();
            assertDefined(instance.instanceMember);
            delete (instance as any)['instanceMember'];
            assert.isUndefined(instance.instanceMember);
            assert.isFalse(Reflect.has(instance, 'instanceMember'));
        });

        it('supports getOwnPropertyDescriptor', () => {
            const instance = createTestInstance();
            assert.deepStrictEqual(
                Reflect.getOwnPropertyDescriptor(instance, 'exec'),
                Reflect.getOwnPropertyDescriptor(/test/, 'exec'),
            );
        });

        it('supports has', () => {
            const instance = createTestInstance();
            assert.isTrue(Reflect.has(instance, 'exec'));
            assert.isTrue(Reflect.has(instance, 'instanceMember'));
            assert.isFalse(Reflect.has(instance, 'some gibberish'));
        });

        it('supports isExtensible and preventExtensions', () => {
            const instance = createTestInstance();
            assert.isTrue(Reflect.isExtensible(instance));
            assert.isTrue(Reflect.preventExtensions(instance));
            assert.isFalse(Reflect.isExtensible(instance));
        });

        it('gets all own keys', () => {
            const instance = createTestInstance();
            assert.deepStrictEqual(Reflect.ownKeys(instance), [
                'href',
                'instanceMember',
                'instanceMember2',
                'instanceMember3',
                'lastIndex',
            ]);
            assert.strictEqual(instance.href, 'hi');
        });

        it('sets and gets values', () => {
            const instance = createTestInstance();

            instance.href = 'hello there';
            instance.instanceMember2 = 9;

            assert.strictEqual(instance.href, 'hello there');
            assert.strictEqual(instance.host, 'www.example.com');
            assert.strictEqual(instance.instanceMember2, 9);
            assert.isUndefined((instance as any).prototype);

            const bareConstructor = multiExtend(ChildClass, URL, RegExp);
            const bareInstance = new bareConstructor(
                [
                    4,
                    /\d+/,
                ],
                ['https://www.example.com'],
                ['\\w+'],
            );

            assert.isTrue(bareInstance.constructor === bareConstructor);
        });

        it('supports setPrototypeOf and getPrototypeOf', () => {
            const instance = createTestInstance();

            class Test {}

            Object.setPrototypeOf(instance, Test);
            assert.strictEqual(Object.getPrototypeOf(instance), Test);
        });
    });

    describe('constructor', () => {
        function createTestConstructor() {
            return multiExtend(ChildClass, URL);
        }

        it('turns empty arguments into undefined', () => {
            class NoArgs {
                public hello = 'there';
            }

            assertTypeOf<AllConstructorParameters<[typeof RegExp, typeof NoArgs]>>().toEqualTypeOf<
                [ConstructorParameters<typeof RegExp>, undefined]
            >();

            const instance = new (multiExtend(RegExp, NoArgs))(['hi'], undefined);
        });

        it('supports defineProperty', () => {
            const constructor: any = createTestConstructor();
            assert.isTrue(
                Reflect.defineProperty(constructor, 'prop1', {
                    value: 'hi',
                }),
            );
            assert.strictEqual(constructor.prop1, 'hi');
        });

        it('supports deleteProperty', () => {
            const constructor = createTestConstructor();
            assertDefined(constructor.canParse);
            const originalCanParse = constructor.canParse;
            delete (constructor as any)['canParse'];
            assert.isUndefined(constructor.canParse);
            assert.isFalse(Reflect.has(constructor, 'canParse'));
            URL.canParse = originalCanParse;
            assert.isTrue(Reflect.has(constructor, 'canParse'));
        });

        it('supports getOwnPropertyDescriptor', () => {
            const constructor = createTestConstructor();
            assert.deepStrictEqual(
                Reflect.getOwnPropertyDescriptor(constructor, 'exec'),
                Reflect.getOwnPropertyDescriptor(/test/, 'exec'),
            );
        });

        it('supports has', () => {
            const constructor = createTestConstructor();
            assert.isTrue(Reflect.has(constructor, 'childThing'));
            assert.isTrue(Reflect.has(constructor, 'canParse'));
            assert.isFalse(Reflect.has(constructor, 'some gibberish'));
        });

        it('supports isExtensible and preventExtensions', () => {
            const constructor = createTestConstructor();
            assert.isTrue(Reflect.isExtensible(constructor));
            assert.isTrue(Reflect.preventExtensions(constructor));
            assert.isFalse(Reflect.isExtensible(constructor));
        });

        it('gets all own keys', () => {
            const constructor = createTestConstructor();
            assert.includeMembers(Reflect.ownKeys(constructor), [
                'canParse',
                'childThing',
                'createObjectURL',
                'length',
                'name',
                'prototype',
                'revokeObjectURL',
            ]);
        });

        it('sets and gets values', () => {
            const constructor = createTestConstructor();

            (constructor as any).canParse = 'fake';

            assert.strictEqual(constructor.canParse as any, 'fake');
            assert.isDefined(constructor.prototype);
            assert.isDefined(constructor.constructor);
        });

        it('supports setPrototypeOf and getPrototypeOf', () => {
            const constructor = createTestConstructor();

            class Test {}

            Object.setPrototypeOf(constructor, Test);
            assert.strictEqual(Object.getPrototypeOf(constructor), Test);
        });
    });
});
