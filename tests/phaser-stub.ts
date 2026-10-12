/**
 * Test-only replacement for the "phaser" package (wired up through the
 * `paths` mapping in tests/tsconfig.json). Game-object base classes accept any
 * method call and return `this`, which is enough for constructors that call
 * setters such as setExistingBody/setPosition/setData.
 */

const permissive = new Proxy(
  {},
  {
    get(target: any, prop, receiver) {
      if (prop in target) return Reflect.get(target, prop, receiver);
      if (prop === "then" || typeof prop === "symbol") return undefined;
      return function (this: any) {
        return this;
      };
    },
  }
);

function makeBase(): any {
  function Base(this: any, ...args: any[]) {
    // Matter sprites: (world, x, y, ...); plain sprites: (scene, x, y, ...)
    this.x = typeof args[1] === "number" ? args[1] : 0;
    this.y = typeof args[2] === "number" ? args[2] : 0;
    this.__data = {};
    this.__destroyed = false;
    // Matter sprites receive the world; Phaser resolves the scene from it
    const owner = args[0];
    this.scene = owner && owner.__scene ? owner.__scene : owner;
  }
  Base.prototype.setPosition = function (x: number, y: number) {
    this.x = x;
    this.y = y;
    this.__position = { x, y };
    return this;
  };
  Base.prototype.destroy = function () {
    this.__destroyed = true;
  };
  Base.prototype.setData = function (key: string, value: unknown) {
    this.__data[key] = value;
    return this;
  };
  Base.prototype.getData = function (key: string) {
    return this.__data[key];
  };
  Object.setPrototypeOf(Base.prototype, permissive);
  return Base;
}

export class Scene {
  constructor(public key?: string) {}
}

export const Geom = {
  Rectangle: class {
    constructor(
      public x = 0,
      public y = 0,
      public width = 0,
      public height = 0
    ) {}
    contains() {
      return false;
    }
  },
};

const Phaser = {
  Scene,
  Geom,
  Physics: { Matter: { Sprite: makeBase() } },
  GameObjects: {
    Sprite: makeBase(),
    TileSprite: makeBase(),
    Container: makeBase(),
  },
  Math: { Between: (min: number) => min },
  Input: { Keyboard: { KeyCodes: { SPACE: 32, ENTER: 13 } } },
  Scenes: { Events: { SHUTDOWN: "shutdown", DESTROY: "destroy" } },
};

(globalThis as any).Phaser = Phaser;

export default Phaser;
