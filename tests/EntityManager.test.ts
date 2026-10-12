// Must be first: entity classes extend the global Phaser at load time.
import "./phaser-stub";
import { test, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { makeFakeScene } from "./helpers";
import { EditorEventBus } from "../src/editor/lib/EditorEventBus";
import { EditorEvents } from "../src/editor/lib/EditorEventTypes";
import { EntityManager } from "../src/editor/lib/EntityManager";
import { EditorLevelHandler } from "../src/editor/lib/EditorLevelHandler";
import { LevelDataManager } from "../src/editor/lib/LevelData";

let scene: ReturnType<typeof makeFakeScene>;
let manager: EntityManager;
let bus: EditorEventBus;

const count = (event: string) => {
  const calls: unknown[][] = [];
  bus.on(event, (...args: unknown[]) => calls.push(args));
  return calls;
};

const entities = () => (manager as any).entities as any[];

beforeEach(() => {
  EditorEventBus.destroy();
  scene = makeFakeScene();
  manager = new EntityManager(scene as any);
  bus = EditorEventBus.getInstance();
});

// --- Event routing -------------------------------------------------------

test("one PLACE_ENTITY creates one entity and one ENTITY_PLACED", () => {
  const placed = count(EditorEvents.ENTITY_PLACED);
  const selected = count(EditorEvents.ENTITY_SELECTED);
  bus.placeEntity("barrel", 100, 100);

  assert.equal(entities().length, 1);
  assert.equal(placed.length, 1);
  // The follow-up selection inside the placement handler is delivered too
  assert.equal(selected.length, 1);
  assert.equal(scene.registry.get("selectedEntity"), entities()[0]);
});

test("events are delivered once under their canonical name only", () => {
  let calls = 0;
  bus.on(EditorEvents.REMOVE_ENTITY, () => calls++);
  let prefixed = 0;
  bus.on(`EB_${EditorEvents.REMOVE_ENTITY}`, () => prefixed++);
  bus.emit(EditorEvents.REMOVE_ENTITY, null);
  assert.equal(calls, 1);
  assert.equal(prefixed, 0);
});

test("a true cycle is cut while different nested events still flow", () => {
  let a = 0;
  let b = 0;
  bus.on("A", () => {
    a++;
    bus.emit("B");
  });
  bus.on("B", () => {
    b++;
    bus.emit("A"); // would loop forever without cycle detection
  });
  bus.emit("A");
  assert.equal(a, 1);
  assert.equal(b, 1);
  // The bus is usable again afterwards
  bus.emit("A");
  assert.equal(a, 2);
});

test("PROPERTY_CHANGE yields one ENTITY_UPDATED and refreshes the selection", () => {
  bus.placeEntity("barrel", 100, 100);
  const entity = entities()[0];
  const updated = count(EditorEvents.ENTITY_UPDATED);
  const selectionPublishes: unknown[] = [];
  scene.registry.events.on("changedata-selectedEntity", (_p: unknown, v: unknown) =>
    selectionPublishes.push(v)
  );

  bus.propertyChanged(entity, "x", 300);

  assert.equal(updated.length, 1);
  assert.deepEqual(selectionPublishes, [entity]);
});

test("select, delete and clear go through the bus without drops or loops", () => {
  bus.placeEntity("barrel", 100, 100);
  bus.placeEntity("crate-small", 200, 200);
  assert.equal(entities().length, 2);
  const [first, second] = entities();

  const removed = count(EditorEvents.ENTITY_REMOVED);
  const deselected = count(EditorEvents.ENTITY_DESELECTED);

  // second is currently selected (placed last); remove it
  assert.equal(scene.registry.get("selectedEntity"), second);
  bus.removeEntity(second);
  assert.equal(removed.length, 1);
  assert.equal(deselected.length, 1);
  assert.equal(scene.registry.get("selectedEntity"), null);
  assert.deepEqual(entities(), [first]);

  bus.emit(EditorEvents.LEVEL_CLEARED);
  assert.equal(entities().length, 0);
  assert.deepEqual(manager.getLevelData(), LevelDataManager.createEmpty());
});

// --- Inspector coordinates ----------------------------------------------

for (const type of ["player", "crate-small", "crate-big", "barrel", "enemy-large", "finish-line", "platform"]) {
  test(`inspector X/Y edits move a ${type} and persist through save/load`, () => {
    bus.placeEntity(type, 100, 100, type === "platform" ? { segmentCount: 3 } : undefined);
    const entity = entities()[0];
    const go = entity.gameObject;

    bus.propertyChanged(entity, "x", 500);
    bus.propertyChanged(entity, "y", 260);

    assert.equal(entity.x, 500);
    assert.equal(entity.y, 260);
    assert.equal(entity.data.x, 500);
    assert.equal(entity.data.y, 260);
    assert.deepEqual(go.__position, { x: 500, y: 260 });

    // Saved data contains exactly one record at the edited position
    const json = LevelDataManager.serialize(manager.getLevelData());
    const saved = JSON.parse(json);
    const records = [
      ...saved.platforms,
      ...saved.enemies,
      ...saved.barrels,
      ...saved.crates,
      ...(saved.finishLine ? [saved.finishLine] : []),
      ...(saved.player ? [saved.player] : []),
    ];
    assert.equal(records.length, 1, json);
    assert.equal(records[0].x, 500);
    assert.equal(records[0].y, 260);

    // Reload: the entity comes back at the edited (grid-aligned) position
    bus.emit(EditorEvents.LEVEL_LOADED, LevelDataManager.deserialize(json));
    assert.equal(entities().length, 1);
    assert.equal(entities()[0].type, type);
    assert.equal(entities()[0].x, 500 - (500 % 24) + 12);
    assert.equal(entities()[0].y, 260 - (260 % 24) + 12);
  });
}

test("invalid coordinate input is rejected and dragging uses the same data", () => {
  bus.placeEntity("barrel", 100, 100);
  const entity = entities()[0];
  const before = { x: entity.x, y: entity.y };
  const updated = count(EditorEvents.ENTITY_UPDATED);

  for (const bad of [NaN, Infinity, "abc", null, undefined]) {
    bus.propertyChanged(entity, "x", bad);
  }
  assert.deepEqual({ x: entity.x, y: entity.y }, before);
  assert.equal(updated.length, 0);

  // Dragging goes through updateEntityPosition, the same canonical path
  (manager as any).updater.updateEntityPosition(entity, 36, 60);
  assert.deepEqual({ x: entity.x, y: entity.y }, { x: 36, y: 60 });
  assert.deepEqual(entity.data.x, 36);
  assert.deepEqual(manager.getLevelData().barrels, [{ x: 36, y: 60 }]);
});

// --- Platform orientation ----------------------------------------------

test("inspector orientation toggles platform geometry and persists", () => {
  bus.placeEntity("platform", 100, 100, { segmentCount: 4 });
  const entity = entities()[0];
  const original = entity.gameObject;
  const pos = { x: entity.x, y: entity.y };

  bus.propertyChanged(entity, "isVertical", true);
  assert.notEqual(entity.gameObject, original, "platform recreated");
  assert.equal(original.__destroyed, true);
  assert.equal(entity.gameObject.isVertical, true);
  assert.equal(entity.data.isVertical, true);
  assert.equal(manager.getLevelData().platforms[0].isVertical, true);
  assert.deepEqual({ x: entity.x, y: entity.y }, pos, "position kept");
  assert.equal(scene.registry.get("selectedEntity"), entity, "still selected");
  assert.ok(scene.removedTextures.includes(entity.data.id), "texture rebuilt");

  // Legacy "orientation" key is mapped at the boundary
  bus.propertyChanged(entity, "orientation", false);
  assert.equal(entity.gameObject.isVertical, false);
  assert.equal(manager.getLevelData().platforms[0].isVertical, false);

  bus.propertyChanged(entity, "isVertical", true);
  const json = LevelDataManager.serialize(manager.getLevelData());
  bus.emit(EditorEvents.LEVEL_LOADED, LevelDataManager.deserialize(json));
  assert.equal(entities()[0].data.isVertical, true);
  assert.equal(entities()[0].gameObject.isVertical, true);
  assert.equal(manager.getLevelData().platforms[0].isVertical, true);
  assert.equal(entities()[0].data.id, entity.data.id, "id preserved on reload");
});

test("loading several platforms keeps one record per platform", () => {
  const level = {
    platforms: [
      { id: "a", x: 12, y: 12, segmentCount: 2, isVertical: false },
      { id: "b", x: 108, y: 12, segmentCount: 3, isVertical: true },
      { id: "c", x: 204, y: 60, segmentCount: 4, isVertical: false },
    ],
  };
  bus.emit(
    EditorEvents.LEVEL_LOADED,
    LevelDataManager.deserialize(JSON.stringify(level))
  );
  assert.deepEqual(
    manager.getLevelData().platforms.map((p) => p.id),
    ["a", "b", "c"]
  );
});

// --- Atomic level load ---------------------------------------------------

const loadFile = async (handler: EditorLevelHandler, contents: string) => {
  const g = globalThis as any;
  const alerts: string[] = [];
  g.alert = (msg: string) => alerts.push(msg);
  g.FileReader = class {
    onload: ((e: any) => void) | null = null;
    onerror: (() => void) | null = null;
    readAsText(file: { text: string }) {
      this.onload?.({ target: { result: file.text } });
    }
  };
  handler.handleFileLoad({ text: contents } as any);
  return alerts;
};

test("loading malformed or invalid files leaves the current level unchanged", async () => {
  const handler = new EditorLevelHandler(manager);
  bus.placeEntity("barrel", 100, 100);
  bus.placeEntity("platform", 200, 200, { segmentCount: 2 });
  const before = [...entities()];
  const levelBefore = JSON.stringify(manager.getLevelData());
  const loaded = count(EditorEvents.LEVEL_LOADED);

  for (const bad of [
    "{ not json",
    '{"platforms":[{"x":1,"y":1,"segmentCount":-1}]}',
    '{"barrels":[{"x":"a","y":1}]}',
    '{"player":{"x":1e999,"y":0}}',
  ]) {
    const alerts = await loadFile(handler, bad);
    assert.equal(alerts.length, 1, `error shown for ${bad}`);
    assert.match(alerts[0], /not been changed/);
  }

  assert.equal(loaded.length, 0);
  assert.deepEqual(entities(), before);
  assert.ok(before.every((e) => !e.gameObject.__destroyed));
  assert.equal(JSON.stringify(manager.getLevelData()), levelBefore);
});

test("a LEVEL_LOADED with an invalid payload does not clear the editor", () => {
  bus.placeEntity("barrel", 100, 100);
  bus.emit(EditorEvents.LEVEL_LOADED, undefined);
  bus.emit(EditorEvents.LEVEL_LOADED, { platforms: "nope" });
  assert.equal(entities().length, 1);
});

test("a valid empty level loads and clears the editor", async () => {
  const handler = new EditorLevelHandler(manager);
  bus.placeEntity("barrel", 100, 100);
  const alerts = await loadFile(handler, "{}");
  assert.deepEqual(alerts, []);
  assert.equal(entities().length, 0);
  assert.deepEqual(manager.getLevelData(), LevelDataManager.createEmpty());
});
