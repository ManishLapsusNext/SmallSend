export type Tier = "FREE" | "PRO" | "PRO_PLUS";

export interface TierConfig {
  days: number;
  label: string;
  isMaximum?: boolean;
  maxDataRooms: number;
  allowInteractive: boolean;
  allowOffice: boolean;
}

export const TIER_CONFIG: Record<Tier, TierConfig> = {
  FREE: {
    days: 7,
    label: "7 Day Analytics",
    isMaximum: false,
    maxDataRooms: 1,
    allowInteractive: false,
    allowOffice: false,
  },
  PRO: {
    days: 90,
    label: "90 Day Analytics",
    isMaximum: true,
    maxDataRooms: 5,
    allowInteractive: true,
    allowOffice: true,
  },
  PRO_PLUS: {
    days: 365,
    label: "1 Year Analytics",
    isMaximum: true,
    maxDataRooms: Infinity,
    allowInteractive: true,
    allowOffice: true,
  },
};

export const getTierConfig = (isPro: boolean, tierOverride?: Tier): TierConfig => {
  if (tierOverride) return TIER_CONFIG[tierOverride];
  return isPro ? TIER_CONFIG.PRO : TIER_CONFIG.FREE;
};
