# multi-extend

A utility for extending multiple classes in JavasScript, enabling the creation of mixins.

docs: https://electrovir.github.io/multi-extend/functions/multiExtend.html

Example usage:

```typescript
export class MyClass extends multiExtend(RegExp, URL) {
    constructor() {
        super(['w+'], ['https://example.com']);
    }
}
```

Note: `instanceof` will not work on instances of a `multiExtend` constructor. Meaning, the following will always be false: `new MyClass() instanceof multiExtend(RegExp, URL)`, even if you save `multiExtend(RegExp, URL)` to a separate variable.

This uses `Proxy` under the hood to ensure maximum ability to use inherited members.
