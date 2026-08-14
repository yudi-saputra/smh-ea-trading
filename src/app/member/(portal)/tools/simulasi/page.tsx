import { redirect } from "next/navigation";
import { getSessionMember } from "@/lib/auth-member";
import { LotSimulator, type LotSimDefaults } from "@/components/member/lot-simulator";
import type { MartingaleMode } from "@/lib/lot-sim";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Simulasi Lot & Modal" };

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

function pick(q: Record<string, string | string[] | undefined>, key: string) {
  const v = q[key];
  const s = Array.isArray(v) ? v[0] : v;
  return s?.trim() || undefined;
}

export default async function LotSimPage({ searchParams }: Props) {
  const member = await getSessionMember();
  if (!member) redirect("/member/login");

  const q = await searchParams;
  const modeRaw = pick(q, "mode");
  const defaults: LotSimDefaults = {
    baseLot: pick(q, "baseLot"),
    mode:
      modeRaw === "aggressive" || modeRaw === "conservative"
        ? (modeRaw as MartingaleMode)
        : undefined,
    multiplier: pick(q, "multiplier"),
    lotIncrement: pick(q, "lotInc"),
    layersPerLot: pick(q, "layersPer"),
    layerPoints: pick(q, "layer"),
    pipValueUsd: pick(q, "pip"),
    openLayers: pick(q, "layers"),
    maxLot: pick(q, "maxLot"),
  };

  return <LotSimulator defaults={defaults} />;
}
