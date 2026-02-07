export type Tier = "FREE" | "PRO" | "PRO_PLUS";

export interface TierConfig {
  days: number;
  label: string;
  isMaximum?: boolean;
}

export const TIER_CONFIG: Record<Tier, TierConfig> = {
  FREE: {
    days: 7,
    label: "7-Day History",
    isMaximum: false,
  },
  PRO: {
    days: 60,
    label: "60-Day History",
    isMaximum: true,
  },
  PRO_PLUS: {
    days: 365,
    label: "1-Year History",
    isMaximum: true,
  },
};

export const getTierConfig = (isPro: boolean, tierOverride?: Tier): TierConfig => {
  if (tierOverride) return TIER_CONFIG[tierOverride];
  return isPro ? TIER_CONFIG.PRO : TIER_CONFIG.FREE;
};
