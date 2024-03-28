# multi-extend

**Warning: this package has severe limitations and countless failure edge cases due to how the JS class system works.**

A utility for extending multiple classes in JavasScript, enabling the creation of mixins.

docs: https://electrovir.github.io/multi-extend/functions/multiExtend.html

Example usage:

```typescript
class MyClass extends multiExtend(RegExp, URL) {
    constructor() {
        super(['w+'], ['https://example.com']);
    }
}
```

This uses `Proxy` under the hood to ensure maximum ability to use inherited members.

## Limitations

-   `instanceof` will not work on constructors passed to `multiExtend`.

    -   Meaning, the following will always be false:

        ```typescript
        const baseClass = multiExtend(RegExp, URL);
        class MyClass extends baseClass {}

        return new MyClass() instanceof baseClass;
        ```

-   Overridden methods will need to be assigned with arrow functions.

    -   example:

        ```typescript
        class A {
            myMethod() {
                return 'hi';
            }
            myMethod2() {
                return 'hi';
            }
        }

        class B {
            myMethod2() {
                return 32;
            }
        }

        class ChildClass extends multiExtend(A, B) {
            // this needs an arrow function
            override myMethod = () => {
                return 'hi';
            };
        }
        ```
