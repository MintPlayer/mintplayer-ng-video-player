// @flow

export class Deferred<T> extends Promise<T> {
    // eslint-disable-next-line no-use-before-define
    resolveFn: (t: T) => Deferred<T> | void;

    constructor() {
        const proxy: { resolve?: (value: T | PromiseLike<T>) => void } = {};
        
        super(resolve => {
            proxy.resolve = resolve;
        });
        
        this.resolveFn = proxy.resolve!;
    }

    // Use Symbol.species in order to let JS
    // know it's a Promise for then/catch/finally
    // $FlowIgnore can't understand this magic
    static override get [Symbol.species]() {
        return Promise;
    }

    resolve(result: T) {
        this.resolveFn(result);
    }

    reject() {
        throw new Error('NotImplemented Reject');
    }

    get promise(): null {
        throw new Error('Old deferred promise property access');
    }
}
