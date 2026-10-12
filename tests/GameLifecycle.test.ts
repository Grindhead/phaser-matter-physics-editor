// Must be first: entity classes extend the global Phaser at load time.
import "./phaser-stub";
import { test } from "node:test";
import assert from "node:assert/strict";
import { FakeEmitter } from "./helpers";
import { Game } from "../src/scenes/Game";

/**
 * Drives Game through Phaser's lifecycle the way Phaser 3.88 does:
 * SceneManager calls init(); stop/restart call Systems.shutdown(), which only
 * emits the "shutdown" event (it never calls Scene#shutdown); removal calls
 * Systems.destroy(), which emits "destroy". Level construction is stubbed out
 * since it needs a renderer; the cleanup wiring is what is under test.
 */
function makeGame() {
  const game = new Game() as any;
  const gameEvents = new FakeEmitter();
  const graphics: any[] = [];
  const counters = { parallaxDestroyed: 0, cameraStopFollow: 0, collisionOff: 0 };

  game.events = new FakeEmitter();
  game.game = { events: gameEvents };
  game.sys = { game: { device: { input: { touch: false } } } };
  game.scene = { launch() {}, restart() {} };
  game.registry = { remove() {} };
  game.input = { keyboard: { addKey: () => new FakeEmitter() } };
  game.add = {
    graphics() {
      const g: any = {
        scene: game,
        visible: false,
        setVisibleCalls: 0,
        setAlpha: () => g,
        setDepth: () => g,
        setVisible(v: boolean) {
          if (!g.scene) throw new Error("setVisible on destroyed graphics");
          g.setVisibleCalls++;
          g.visible = v;
          return g;
        },
        destroy() {
          g.scene = undefined;
        },
      };
      graphics.push(g);
      return g;
    },
  };
  const world: any = new FakeEmitter();
  world.setBounds = () => {};
  const off = world.off.bind(world);
  world.off = (event: string, fn?: any, ctx?: any) => {
    if (event === "collisionstart") counters.collisionOff++;
    return off(event, fn, ctx);
  };
  game.matter = { world };

  // Stub the renderer-dependent parts of a level start
  game.initGame = function () {
    this.cameraManager = {
      destroy: () => counters.cameraStopFollow++,
    };
    this.setupCollisions();
  };
  game.startGame = () => {};
  game.setupRestartKeys = () => {};
  game.destroyCurrentEntities = () => {};

  const start = () => {
    game.init();
    // ParallaxManager is created in init(); count its disposal
    game.parallaxManager = { destroy: () => counters.parallaxDestroyed++ };
  };
  const shutdown = () => {
    game.events.emit("shutdown");
    // Phaser's DisplayList destroys every child on shutdown
    graphics.forEach((g) => g.destroy());
  };

  return { game, gameEvents, graphics, counters, start, shutdown, world };
}

test("ten restarts leave exactly one togglePhysicsDebug handler", () => {
  const { gameEvents, start, shutdown } = makeGame();
  start();
  for (let i = 0; i < 10; i++) {
    shutdown();
    start();
  }
  assert.equal(gameEvents.listenerCount("togglePhysicsDebug"), 1);
});

test("one toggle flips visibility once and never touches destroyed graphics", () => {
  const { gameEvents, graphics, start, shutdown } = makeGame();
  start();
  for (let i = 0; i < 10; i++) {
    shutdown();
    start();
  }
  const live = graphics[graphics.length - 1];
  const before = live.visible;
  const callsBefore = live.setVisibleCalls;
  assert.doesNotThrow(() => gameEvents.emit("togglePhysicsDebug"));
  assert.equal(live.setVisibleCalls - callsBefore, 1, "toggled exactly once");
  assert.equal(live.visible, !before);
  assert.doesNotThrow(() => gameEvents.emit("togglePhysicsDebug"));
  assert.equal(live.visible, before);
});

test("stopping runs cleanup once and releases camera, parallax and collisions", () => {
  const { game, gameEvents, counters, start, shutdown, world } = makeGame();
  start();
  assert.equal(world.listenerCount("collisionstart"), 1);

  shutdown();
  assert.equal(counters.parallaxDestroyed, 1);
  assert.equal(counters.cameraStopFollow, 1);
  assert.equal(world.listenerCount("collisionstart"), 0);
  assert.equal(gameEvents.listenerCount("togglePhysicsDebug"), 0);

  // A later destroy (scene removal) or a stray second shutdown is a no-op
  game.events.emit("destroy");
  game.events.emit("shutdown");
  game.shutdown();
  assert.equal(counters.parallaxDestroyed, 1);
  assert.equal(counters.cameraStopFollow, 1);
});

test("destroying a running scene runs cleanup exactly once", () => {
  const { game, counters, start } = makeGame();
  start();
  game.events.emit("destroy");
  assert.equal(counters.parallaxDestroyed, 1);
  assert.equal(game.events.listenerCount("shutdown"), 0);
  assert.equal(game.events.listenerCount("destroy"), 0);
});
