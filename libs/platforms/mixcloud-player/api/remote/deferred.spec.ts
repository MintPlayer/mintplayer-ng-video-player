import { Deferred } from './deferred';

describe('Deferred', () => {
  it('is a real promise, so it can be awaited directly', async () => {
    const deferred = new Deferred<string>();

    deferred.resolve('done');

    expect(deferred).toBeInstanceOf(Promise);
    await expect(deferred).resolves.toBe('done');
  });

  it('stays pending until someone resolves it', async () => {
    const deferred = new Deferred<number>();
    let settled = false;
    deferred.then(() => (settled = true));

    // Two microtask turns: enough for a promise that was already resolved.
    await Promise.resolve();
    await Promise.resolve();
    expect(settled).toBe(false);

    deferred.resolve(1);
    await deferred;
    expect(settled).toBe(true);
  });

  it('resolves whoever attached before the value arrived', async () => {
    const deferred = new Deferred<string>();
    const early = deferred.then((value) => `early:${value}`);

    deferred.resolve('value');

    await expect(early).resolves.toBe('early:value');
  });

  it('resolves whoever attaches after the value arrived', async () => {
    const deferred = new Deferred<string>();
    deferred.resolve('value');

    await expect(deferred.then((value) => `late:${value}`)).resolves.toBe(
      'late:value'
    );
  });

  it('keeps the first value when resolved twice', async () => {
    const deferred = new Deferred<string>();

    deferred.resolve('first');
    deferred.resolve('second');

    await expect(deferred).resolves.toBe('first');
  });

  it('resolves through a promise handed to resolve', async () => {
    const deferred = new Deferred<string>();

    deferred.resolve(Promise.resolve('chained') as unknown as string);

    await expect(deferred).resolves.toBe('chained');
  });

  it('reports Promise as its species, so then/catch hand back plain promises', async () => {
    const deferred = new Deferred<number>();

    const chained = deferred.then((value) => value);

    expect(
      (Deferred as unknown as Record<symbol, unknown>)[Symbol.species]
    ).toBe(Promise);
    expect(chained).toBeInstanceOf(Promise);
    // Without the Symbol.species override this would be a Deferred, and the
    // engine would try to construct one with a resolver it does not accept.
    expect(chained).not.toBeInstanceOf(Deferred);

    deferred.resolve(0);
    await chained;
  });

  it('keeps catch and finally working off the same chain', async () => {
    const deferred = new Deferred<number>();
    const seen: string[] = [];
    const chain = deferred
      .then((value) => {
        seen.push(`then:${value}`);
      })
      .catch(() => {
        seen.push('catch');
      })
      .finally(() => {
        seen.push('finally');
      });

    deferred.resolve(7);
    await chain;

    expect(seen).toEqual(['then:7', 'finally']);
  });

  it('refuses to reject, because nothing in the widget protocol rejects', () => {
    const deferred = new Deferred<string>();

    expect(() => deferred.reject()).toThrow('NotImplemented Reject');

    deferred.resolve('unused');
  });

  it('shouts if old code reaches for the .promise property', () => {
    const deferred = new Deferred<string>();

    expect(() => deferred.promise).toThrow(
      'Old deferred promise property access'
    );

    deferred.resolve('unused');
  });

  it('exposes the raw resolve function it captured from the constructor', async () => {
    const deferred = new Deferred<string>();

    expect(typeof deferred.resolveFn).toBe('function');
    deferred.resolveFn('direct');

    await expect(deferred).resolves.toBe('direct');
  });
});
