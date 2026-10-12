import { test } from "node:test";
import assert from "node:assert/strict";
import {
  LevelDataManager,
  LevelDataError,
  validateLevel,
} from "../src/editor/lib/LevelData";

const valid = {
  platforms: [{ id: "p1", x: 10, y: 20, segmentCount: 3, isVertical: true }],
  enemies: [{ x: 1, y: 2, type: "enemy-small" }],
  barrels: [{ x: 3, y: 4 }],
  crates: [{ x: 5, y: 6, type: "big" }],
  finishLine: { x: 7, y: 8 },
  player: { x: 9, y: 10 },
};

test("parse accepts a well-formed level and round-trips through serialize", () => {
  const result = LevelDataManager.parse(JSON.stringify(valid));
  assert.equal(result.ok, true);
  if (!result.ok) return;
  assert.deepEqual(result.data, valid);
  const again = LevelDataManager.parse(LevelDataManager.serialize(result.data));
  assert.deepEqual(again, result);
});

test("an explicit empty level parses successfully", () => {
  const result = LevelDataManager.parse("{}");
  assert.deepEqual(result, { ok: true, data: LevelDataManager.createEmpty() });
  const serializedEmpty = LevelDataManager.serialize(
    LevelDataManager.createEmpty()
  );
  assert.equal(LevelDataManager.parse(serializedEmpty).ok, true);
});

test("malformed JSON is reported, not turned into an empty level", () => {
  const result = LevelDataManager.parse("{ not json");
  assert.equal(result.ok, false);
  if (!result.ok) assert.match(result.error, /not valid JSON/);
  assert.throws(() => LevelDataManager.deserialize("{ not json"), LevelDataError);
});

const rejects = (label: string, data: unknown, pattern: RegExp) =>
  test(`rejects ${label}`, () => {
    const result = LevelDataManager.parse(JSON.stringify(data));
    assert.equal(result.ok, false, `expected ${label} to be rejected`);
    if (!result.ok) assert.match(result.error, pattern);
  });

rejects("a non-object root", [1, 2], /<root>/);
rejects("platforms that is not an array", { platforms: {} }, /"platforms"/);
rejects(
  "a string coordinate",
  { barrels: [{ x: "10", y: 2 }] },
  /barrels\[0\]\.x/
);
rejects(
  "a missing coordinate",
  { player: { x: 1 } },
  /player\.y/
);
rejects(
  "a zero segment count",
  { platforms: [{ x: 1, y: 1, segmentCount: 0 }] },
  /segmentCount/
);
rejects(
  "a fractional segment count",
  { platforms: [{ x: 1, y: 1, segmentCount: 2.5 }] },
  /segmentCount/
);
rejects(
  "a huge segment count",
  { platforms: [{ x: 1, y: 1, segmentCount: 1e9 }] },
  /segmentCount/
);
rejects(
  "a non-boolean isVertical",
  { platforms: [{ x: 1, y: 1, segmentCount: 2, isVertical: "yes" }] },
  /isVertical/
);
rejects(
  "an unknown enemy type",
  { enemies: [{ x: 1, y: 1, type: "dragon" }] },
  /enemies\[0\]\.type/
);
rejects(
  "an unknown crate type",
  { crates: [{ x: 1, y: 1, type: "huge" }] },
  /crates\[0\]\.type/
);

test("non-finite positions are rejected (JSON cannot carry them, objects can)", () => {
  for (const bad of [Infinity, -Infinity, NaN]) {
    assert.throws(
      () => validateLevel({ player: { x: bad, y: 0 } }),
      LevelDataError
    );
  }
  // 1e999 overflows to Infinity during JSON.parse
  const result = LevelDataManager.parse('{"barrels":[{"x":1e999,"y":0}]}');
  assert.equal(result.ok, false);
});
