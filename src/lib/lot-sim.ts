export type MartingaleMode = "conservative" | "aggressive";

export type LotSimInput = {
  baseLot: number;
  mode: MartingaleMode;
  multiplier: number;
  lotIncrement: number;
  layersPerLot: number;
  layerPoints: number;
  pipValueUsd: number;
  openLayers: number;
  maxLot?: number;
  lotStep?: number;
  pointsPerPip?: number;
};

export type LotSimLevel = {
  level: number;
  lot: number;
  distancePips: number;
  floatingUsd: number;
};

export type LotSimResult = {
  levels: LotSimLevel[];
  totalLot: number;
  totalFloatingUsd: number;
};

const LOT_STEP = 0.01;
const LOT_MIN = 0.01;
const POINTS_PER_PIP = 10;
const MAX_OPEN_LAYERS = 50;

export function clampOpenLayers(n: number) {
  if (!Number.isFinite(n)) return 1;
  return Math.min(MAX_OPEN_LAYERS, Math.max(1, Math.trunc(n)));
}

/** Match EA CalculateLotForLayer: floor to volume step, then min/max lot. */
export function lotForLayer(
  layerNumber: number,
  input: Pick<
    LotSimInput,
    | "baseLot"
    | "mode"
    | "multiplier"
    | "lotIncrement"
    | "layersPerLot"
    | "maxLot"
    | "lotStep"
  >,
): number {
  const step = input.lotStep && input.lotStep > 0 ? input.lotStep : LOT_STEP;
  const layersPer = Math.max(1, Math.trunc(input.layersPerLot || 1));
  let lots = 0;
  if (input.mode === "conservative") {
    const grp = Math.floor((layerNumber - 1) / layersPer);
    lots = input.baseLot + grp * input.lotIncrement;
  } else {
    lots = input.baseLot * Math.pow(input.multiplier, layerNumber - 1);
  }
  lots = Math.floor(lots / step + 1e-12) * step;
  if (lots < LOT_MIN) lots = LOT_MIN;
  const maxLot = input.maxLot ?? 0;
  if (maxLot > 0 && lots > maxLot) lots = maxLot;
  return Number(lots.toFixed(8));
}

export function simulateLotCapital(input: LotSimInput): LotSimResult {
  const n = clampOpenLayers(input.openLayers);
  const ppp =
    input.pointsPerPip && input.pointsPerPip > 0
      ? input.pointsPerPip
      : POINTS_PER_PIP;
  const levels: LotSimLevel[] = [];
  const lots: number[] = [];
  let totalLot = 0;

  for (let i = 1; i <= n; i++) {
    const lot = lotForLayer(i, input);
    lots.push(lot);
    totalLot += lot;
  }

  for (let i = 1; i <= n; i++) {
    let floating = 0;
    const distancePips = ((i - 1) * input.layerPoints) / ppp;
    for (let j = 1; j < i; j++) {
      const movedPips = ((i - j) * input.layerPoints) / ppp;
      floating += lots[j - 1] * movedPips * input.pipValueUsd;
    }
    levels.push({
      level: i,
      lot: lots[i - 1],
      distancePips,
      floatingUsd: floating === 0 ? 0 : -floating,
    });
  }

  const last = levels[levels.length - 1];
  return {
    levels,
    totalLot: Number(totalLot.toFixed(8)),
    totalFloatingUsd: last?.floatingUsd ?? 0,
  };
}
