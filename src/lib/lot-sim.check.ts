import assert from "node:assert/strict";
import { lotForLayer, simulateLotCapital } from "./lot-sim";

const cons = {
  baseLot: 0.06,
  mode: "conservative" as const,
  multiplier: 1.2,
  lotIncrement: 0.01,
  layersPerLot: 3,
  maxLot: 0,
};

assert.equal(lotForLayer(1, cons), 0.06);
assert.equal(lotForLayer(3, cons), 0.06);
assert.equal(lotForLayer(4, cons), 0.07);
assert.equal(lotForLayer(7, cons), 0.08);

const agg = { ...cons, mode: "aggressive" as const, multiplier: 1.2 };
assert.equal(lotForLayer(1, agg), 0.06);
assert.equal(lotForLayer(2, agg), 0.07);

const sim = simulateLotCapital({
  ...agg,
  layerPoints: 200,
  pipValueUsd: 10,
  openLayers: 3,
});
assert.equal(sim.levels[0].floatingUsd, 0);
assert.equal(sim.levels[1].floatingUsd, -12);
assert.equal(sim.levels[2].floatingUsd, -38);

console.log("lot-sim.check ok");
