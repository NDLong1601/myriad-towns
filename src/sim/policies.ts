export interface PolicyDef {
  readonly id: string;
  readonly icon: string;
  readonly nameKey: string;
  readonly descKey: string;
  readonly effectDescKey: string;
}

export const POLICIES: readonly PolicyDef[] = [
  {
    id: 'green_city',
    icon: '🌿',
    nameKey: 'policy.green_city.name',
    descKey: 'policy.green_city.desc',
    effectDescKey: 'policy.green_city.effect',
  },
  {
    id: 'industrial_drive',
    icon: '🏭',
    nameKey: 'policy.industrial_drive.name',
    descKey: 'policy.industrial_drive.desc',
    effectDescKey: 'policy.industrial_drive.effect',
  },
  {
    id: 'public_transit_subsidy',
    icon: '🚌',
    nameKey: 'policy.public_transit_subsidy.name',
    descKey: 'policy.public_transit_subsidy.desc',
    effectDescKey: 'policy.public_transit_subsidy.effect',
  },
  {
    id: 'healthcare_focus',
    icon: '🏥',
    nameKey: 'policy.healthcare_focus.name',
    descKey: 'policy.healthcare_focus.desc',
    effectDescKey: 'policy.healthcare_focus.effect',
  },
  {
    id: 'night_economy',
    icon: '🌙',
    nameKey: 'policy.night_economy.name',
    descKey: 'policy.night_economy.desc',
    effectDescKey: 'policy.night_economy.effect',
  },
];
