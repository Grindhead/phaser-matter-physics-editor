/**
 * Fakes for the parts of Phaser the editor and game logic touch, so those
 * modules run under `node --test` without a browser or WebGL. The "phaser"
 * module itself is replaced by ./phaser-stub.ts via tests/tsconfig.json.
 */

type Listener = { fn: (...args: any[]) => void; ctx?: unknown; once: boolean };

export class FakeEmitter {
  private listeners = new Map<string, Listener[]>();

  on(event: string, fn: (...args: any[]) => void, ctx?: unknown) {
    const list = this.listeners.get(event) ?? [];
    list.push({ fn, ctx, once: false });
    this.listeners.set(event, list);
    return this;
  }

  once(event: string, fn: (...args: any[]) => void, ctx?: unknown) {
    const list = this.listeners.get(event) ?? [];
    list.push({ fn, ctx, once: true });
    this.listeners.set(event, list);
    return this;
  }

  off(event: string, fn?: (...args: any[]) => void, ctx?: unknown) {
    const list = this.listeners.get(event);
    if (!list) return this;
    this.listeners.set(
      event,
      list.filter(
        (l) =>
          !(
            (fn === undefined || l.fn === fn) &&
            (ctx === undefined || l.ctx === ctx)
          )
      )
    );
    return this;
  }

  emit(event: string, ...args: any[]) {
    const list = [...(this.listeners.get(event) ?? [])];
    for (const l of list) {
      if (l.once) this.off(event, l.fn, l.ctx);
      l.fn.apply(l.ctx, args);
    }
    return list.length > 0;
  }

  listenerCount(event: string) {
    return this.listeners.get(event)?.length ?? 0;
  }

  removeAllListeners() {
    this.listeners.clear();
  }
}

/** An object on which every property is a chainable no-op function. */
export const chainable = (): any => {
  const target: any = function () {};
  const proxy: any = new Proxy(target, {
    get: (_t, prop) => {
      if (prop === "then") return undefined;
      if (prop in target) return target[prop];
      return () => proxy;
    },
    set: (_t, prop, value) => {
      target[prop] = value;
      return true;
    },
  });
  return proxy;
};

export class FakeRegistry {
  private values = new Map<string, unknown>();
  events = new FakeEmitter();
  get(key: string) {
    return this.values.get(key);
  }
  set(key: string, value: unknown) {
    const had = this.values.has(key);
    this.values.set(key, value);
    if (had) this.events.emit(`changedata-${key}`, this, value);
    else this.events.emit("setdata", this, key, value);
  }
}

/** A scene object sufficient for EntityManager / EntityUpdater. */
export function makeFakeScene() {
  const removedTextures: string[] = [];
  const scene: any = {
    events: new FakeEmitter(),
    registry: new FakeRegistry(),
    input: Object.assign(new FakeEmitter(), {
      keyboard: {
        addKey: () => Object.assign(new FakeEmitter(), { isDown: false }),
      },
    }),
    add: chainable(),
    scene: { key: "EditorScene" },
    make: chainable(),
    matter: { bodies: chainable(), world: Object.assign(new FakeEmitter(), { __scene: undefined }) },
    sys: { game: { device: { os: { desktop: false } } } },
    anims: chainable(),
    time: { delayedCall: (_ms: number, fn: () => void) => fn() },
    cache: { json: { get: () => ({ platform: { collisionFilter: {} } }) } },
    textures: {
      exists: () => true,
      remove: (key: string) => removedTextures.push(key),
    },
    removedTextures,
  };
  scene.matter.world.__scene = scene;
  return scene;
}

/** A game object stand-in that records its position. */
export function makeGameObject() {
  return {
    x: 0,
    y: 0,
    destroyed: false,
    setPosition(x: number, y: number) {
      this.x = x;
      this.y = y;
      return this;
    },
    destroy() {
      this.destroyed = true;
    },
    setTint() {},
    clearTint() {},
    getBounds() {
      return { width: 24, height: 24 };
    },
  };
}
