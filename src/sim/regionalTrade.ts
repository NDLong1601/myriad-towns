import { BASE_CAPACITY } from '@/sim/catalog';
import type { City, PlacedBuilding } from '@/sim/city';
import { TICK_DT, TICK_HZ } from '@/sim/clock';
import { tileKey } from '@/sim/terrainQuery';
import type { TownStore } from '@/sim/towns';
import { TileFlag } from '@/world/biomes';

export const TRADE_RESOURCES = ['food', 'wood', 'stone', 'ore', 'coal', 'metal', 'goods'] as const;
export type TradeResource = (typeof TRADE_RESOURCES)[number];
const tradable: ReadonlySet<string> = new Set(TRADE_RESOURCES);
export const TOWN_ROLES = ['balanced', 'farming', 'industry', 'learning', 'tourism'] as const;
export type TownRole = (typeof TOWN_ROLES)[number];
export const LOCAL_POLICIES = [
  'none',
  'green_city',
  'industrial_drive',
  'healthcare_focus',
] as const;
export type LocalPolicy = (typeof LOCAL_POLICIES)[number];

const POLICY_COST: Partial<Record<LocalPolicy, readonly [string, number]>> = {
  green_city: ['goods', 0.2],
  healthcare_focus: ['food', 0.4],
};

const ROLE_EFFECTS: Record<TownRole, Readonly<Record<string, number>>> = {
  balanced: {},
  farming: { food: 1.25, goods: 0.9 },
  industry: { ore: 1.25, coal: 1.25, metal: 1.25, food: 0.9 },
  learning: { knowledge: 1.25, metal: 0.9 },
  tourism: { goods: 1.2, ore: 0.9, coal: 0.9 },
};

export interface RouteOrder {
  from: number;
  to: number;
  resource: TradeResource;
  amount: number;
  keep: number;
}

export interface TradeRoute extends RouteOrder {
  id: number;
  duration: number;
  remaining: number;
  cargo: number;
  delivered: number;
}

export interface RegionalSave {
  roles: [number, TownRole][];
  policies?: [number, LocalPolicy][];
  reserves: [number, Record<string, number>][];
  routes: TradeRoute[];
  nextId: number;
}

const ROUTE_LIMIT = 24;
const MAX_DISTANCE = 256;
const MAX_SEARCH = 65_536;
const DIRECTIONS = [
  [1, 0],
  [0, -1],
  [-1, 0],
  [0, 1],
] as const;

/** The regional economy is opt-in per town. Construction and non-cargo goods use the city stock. */
export class RegionalTrade {
  private readonly roles = new Map<number, TownRole>();
  private readonly policies = new Map<number, LocalPolicy>();
  private readonly paid = new Set<number>();
  private readonly reserves = new Map<number, Record<string, number>>();
  private readonly routes = new Map<number, TradeRoute>();
  private nextId = 1;
  readonly listeners = new Set<() => void>();

  constructor(
    private readonly city: City,
    private readonly towns: TownStore,
  ) {
    towns.on((event) => {
      if (event.type === 'removed') this.removeTown(event.town.id);
    });
    city.on((event) => {
      if (event.type !== 'removed' || !this.isPort(event.building) || city.get(event.building.uid))
        return;
      for (const route of this.routes.values()) {
        if (route.from === event.building.uid || route.to === event.building.uid)
          this.cancel(route.id);
      }
    });
  }

  role(town: number): TownRole {
    return this.roles.get(town) ?? 'balanced';
  }

  setRole(town: number, role: TownRole): void {
    if (!this.towns.get(town) || !TOWN_ROLES.includes(role)) return;
    if (role === 'balanced') this.roles.delete(town);
    else this.roles.set(town, role);
    this.changed();
  }

  outputFactor(town: number, resource: string): number {
    return ROLE_EFFECTS[this.role(town)][resource] ?? 1;
  }

  get hasReserves(): boolean {
    return this.reserves.size > 0;
  }

  policy(town: number): LocalPolicy {
    return this.policies.get(town) ?? 'none';
  }

  setPolicy(town: number, policy: LocalPolicy): void {
    if (!this.towns.get(town) || !LOCAL_POLICIES.includes(policy)) return;
    this.paid.delete(town);
    if (policy === 'none') this.policies.delete(town);
    else this.policies.set(town, policy);
    this.changed();
  }

  isPolicyActive(town: number, policy: string): boolean {
    return (
      this.city.isPolicyActive(policy) ||
      (this.policy(town) === policy && (!POLICY_COST[this.policy(town)] || this.paid.has(town)))
    );
  }

  /** Apply town upkeep to the stock supplying the policy. Citywide policies already pay globally. */
  fundPolicies(consumed: Record<string, number>, local: Record<string, number>): void {
    this.paid.clear();
    for (const [town, policy] of this.policies) {
      const cost = POLICY_COST[policy];
      if (!cost || this.city.isPolicyActive(policy)) continue;
      const [resource, rate] = cost;
      const stock = this.operatingStock(town, resource);
      const available = stock[resource] ?? 0;
      if (available < rate * TICK_DT) continue;
      this.paid.add(town);
      stock[resource] = available - rate * TICK_DT;
      consumed[resource] = (consumed[resource] ?? 0) + rate;
      if (stock !== this.city.stock) local[resource] = (local[resource] ?? 0) + rate;
    }
  }

  reserve(town: number): Readonly<Record<string, number>> | undefined {
    return this.reserves.get(town);
  }

  capacity(resource: string): number {
    return BASE_CAPACITY[resource] ?? 0;
  }

  operatingStock(town: number, resource: string): Record<string, number> {
    return (tradable.has(resource) ? this.reserves.get(town) : undefined) ?? this.city.stock;
  }

  open(town: number): void {
    if (!this.towns.get(town) || this.reserves.has(town)) return;
    this.reserves.set(town, {});
    this.changed();
  }

  /** Transfer stock between the city and a local reserve. A negative amount withdraws stock. */
  transfer(town: number, resource: TradeResource, amount: number): number {
    const reserve = this.reserves.get(town);
    if (!reserve || !tradable.has(resource) || !Number.isFinite(amount)) return 0;
    const local = reserve[resource] ?? 0;
    const shared = this.city.stock[resource] ?? 0;
    const move =
      amount >= 0
        ? Math.max(0, Math.min(amount, shared, this.capacity(resource) - local))
        : -Math.min(-amount, local, Math.max(0, this.city.capacityOf(resource) - shared));
    if (!move) return 0;
    reserve[resource] = local + move;
    this.city._addStock({ [resource]: -move }, 1);
    this.changed();
    return move;
  }

  close(town: number): void {
    this.removeTown(town, false);
  }

  ports(): PlacedBuilding[] {
    return [...this.city.all()].filter((b) => this.isPort(b) && this.city.isActive(b.uid));
  }

  shipments(): readonly Readonly<TradeRoute>[] {
    return [...this.routes.values()];
  }

  add(order: RouteOrder): 'invalid' | 'noWater' | 'limit' | 'ok' {
    if (this.routes.size >= ROUTE_LIMIT) return 'limit';
    const from = this.port(order.from);
    const to = this.port(order.to);
    if (
      !from ||
      !to ||
      !tradable.has(order.resource) ||
      !Number.isSafeInteger(order.amount) ||
      order.amount < 1 ||
      !Number.isSafeInteger(order.keep) ||
      order.keep < 0 ||
      order.amount + order.keep > this.capacity(order.resource)
    )
      return 'invalid';
    const source = this.towns.townOfBuilding(from);
    const target = this.towns.townOfBuilding(to);
    if (source === target || !this.reserves.has(source) || !this.reserves.has(target))
      return 'invalid';
    if (
      [...this.routes.values()].some(
        (r) => r.from === order.from && r.to === order.to && r.resource === order.resource,
      )
    )
      return 'invalid';
    const distance = connectedDistance(this.city, from, to);
    if (distance === undefined) return 'noWater';
    const id = this.nextId++;
    this.routes.set(id, {
      ...order,
      id,
      duration: Math.max(5 * TICK_HZ, Math.ceil((distance * TICK_HZ) / 4)),
      remaining: 0,
      cargo: 0,
      delivered: 0,
    });
    this.changed();
    return 'ok';
  }

  cancel(id: number): void {
    const route = this.routes.get(id);
    if (!route) return;
    this.routes.delete(id);
    if (route.cargo) {
      const from = this.city.get(route.from);
      const reserve = from ? this.reserves.get(this.towns.townOfBuilding(from)) : undefined;
      const local = reserve?.[route.resource] ?? 0;
      const returned = reserve ? Math.min(this.capacity(route.resource) - local, route.cargo) : 0;
      if (reserve) reserve[route.resource] = local + returned;
      if (route.cargo > returned)
        this.city._addStock({ [route.resource]: route.cargo - returned }, 1);
    }
    this.changed();
  }

  tick(canDispatch: (uid: number) => boolean): void {
    let changed = false;
    for (const route of this.routes.values()) {
      const from = this.port(route.from);
      const to = this.port(route.to);
      if (route.remaining > 0) {
        route.remaining--;
        if (route.remaining > 0) continue;
        changed = true;
      }
      if (!from || !to) continue; // Wait for an abandoned port to reopen.
      const source = this.reserves.get(this.towns.townOfBuilding(from));
      const target = this.reserves.get(this.towns.townOfBuilding(to));
      if (!source || !target || source === target) {
        this.cancel(route.id);
        continue;
      }
      const resource = route.resource;
      const cap = this.capacity(resource);
      if (route.cargo > 0) {
        const stock = target[resource] ?? 0;
        if (cap - stock + 1e-9 < route.cargo) continue;
        target[resource] = Math.min(cap, stock + route.cargo);
        route.delivered += route.cargo;
        route.cargo = 0;
        changed = true;
      }
      if (!canDispatch(route.from)) continue;
      if (
        (source[resource] ?? 0) - route.keep + 1e-9 < route.amount ||
        cap - (target[resource] ?? 0) + 1e-9 < route.amount
      )
        continue;
      source[resource] = (source[resource] ?? 0) - route.amount;
      route.cargo = route.amount;
      route.remaining = route.duration;
      changed = true;
    }
    if (changed) this.changed();
  }

  snapshot(): RegionalSave {
    return {
      roles: [...this.roles],
      policies: [...this.policies],
      reserves: [...this.reserves].map(([id, resources]) => [id, { ...resources }]),
      routes: this.shipments().map((r) => ({ ...r })),
      nextId: this.nextId,
    };
  }

  restore(save: RegionalSave): void {
    this.roles.clear();
    this.policies.clear();
    this.paid.clear();
    this.reserves.clear();
    this.routes.clear();
    for (const [id, role] of Array.isArray(save.roles) ? save.roles : []) {
      if (this.towns.get(id) && TOWN_ROLES.includes(role)) this.roles.set(id, role);
    }
    for (const [id, policy] of Array.isArray(save.policies) ? save.policies : []) {
      if (this.towns.get(id) && LOCAL_POLICIES.includes(policy) && policy !== 'none')
        this.policies.set(id, policy);
    }
    for (const [id, stock] of Array.isArray(save.reserves) ? save.reserves : []) {
      if (!this.towns.get(id) || !stock) continue;
      const reserve: Record<string, number> = {};
      for (const r of TRADE_RESOURCES) {
        const amount = stock[r];
        if (amount !== undefined && Number.isFinite(amount) && amount > 0)
          reserve[r] = Math.min(this.capacity(r), amount);
      }
      this.reserves.set(id, reserve);
    }
    for (const [id, policy] of this.policies) {
      const cost = POLICY_COST[policy];
      if (cost && (this.operatingStock(id, cost[0])[cost[0]] ?? 0) >= cost[1] * TICK_DT)
        this.paid.add(id);
    }
    this.nextId = Number.isSafeInteger(save.nextId) ? Math.max(1, save.nextId) : 1;
    for (const route of (Array.isArray(save.routes) ? save.routes : []).slice(0, ROUTE_LIMIT)) {
      if (
        !route ||
        !tradable.has(route.resource) ||
        !Number.isSafeInteger(route.id) ||
        route.id < 1 ||
        !Number.isSafeInteger(route.amount) ||
        route.amount < 1 ||
        route.amount > this.capacity(route.resource) ||
        !Number.isSafeInteger(route.keep) ||
        route.keep < 0 ||
        route.keep + route.amount > this.capacity(route.resource) ||
        !Number.isSafeInteger(route.duration) ||
        route.duration < 1 ||
        route.duration > MAX_DISTANCE * TICK_HZ ||
        !Number.isSafeInteger(route.remaining) ||
        route.remaining < 0 ||
        route.remaining > route.duration ||
        !Number.isSafeInteger(route.cargo) ||
        route.cargo < 0 ||
        route.cargo > route.amount ||
        !Number.isSafeInteger(route.delivered) ||
        route.delivered < 0
      )
        continue;
      this.routes.set(route.id, { ...route });
      this.nextId = Math.max(this.nextId, route.id + 1);
      if (!this.isPort(this.city.get(route.from)) || !this.isPort(this.city.get(route.to)))
        this.cancel(route.id);
    }
    this.changed();
  }

  private removeTown(town: number, removeRole = true): void {
    if (removeRole) {
      this.roles.delete(town);
      this.policies.delete(town);
      this.paid.delete(town);
    }
    const stock = this.reserves.get(town);
    if (!stock) return;
    this.reserves.delete(town);
    this.city._addStock(stock, 1);
    for (const route of this.routes.values()) {
      const from = this.city.get(route.from);
      const to = this.city.get(route.to);
      if (
        !from ||
        !to ||
        !this.reserves.has(this.towns.townOfBuilding(from)) ||
        !this.reserves.has(this.towns.townOfBuilding(to))
      )
        this.cancel(route.id);
    }
    this.changed();
  }

  private port(uid: number): PlacedBuilding | undefined {
    const b = this.city.get(uid);
    return this.isPort(b) && this.city.isActive(uid) ? b : undefined;
  }

  private isPort(b: PlacedBuilding | undefined): b is PlacedBuilding {
    return b?.def.voyage?.kind === 'cargo';
  }

  private changed(): void {
    for (const listener of this.listeners) listener();
  }
}

/** Search a bounded span of face-connected water from the shore of one port to the other. */
function connectedDistance(
  city: City,
  from: PlacedBuilding,
  to: PlacedBuilding,
): number | undefined {
  if (Math.abs(from.x - to.x) + Math.abs(from.z - to.z) > MAX_DISTANCE + 16) return undefined;
  const water = (x: number, z: number): boolean =>
    !!(city.terrain.tile(x, z).flags & TileFlag.Water);
  function shore(port: PlacedBuilding): { x: number; z: number }[] {
    const tiles = [];
    for (let z = port.z - 2; z < port.z + port.def.footprint.d + 2; z++) {
      for (let x = port.x - 2; x < port.x + port.def.footprint.w + 2; x++) {
        const dx = Math.max(0, port.x - x, x - port.x - port.def.footprint.w + 1);
        const dz = Math.max(0, port.z - z, z - port.z - port.def.footprint.d + 1);
        if (dx + dz > 0 && dx + dz <= 2 && water(x, z)) tiles.push({ x, z });
      }
    }
    return tiles;
  }
  const targets = new Set(shore(to).map(({ x, z }) => tileKey(x, z)));
  if (!targets.size) return undefined;
  const targetX0 = to.x - 2;
  const targetX1 = to.x + to.def.footprint.w + 1;
  const targetZ0 = to.z - 2;
  const targetZ1 = to.z + to.def.footprint.d + 1;
  const queue = shore(from).map((p) => ({ ...p, distance: 0 }));
  const seen = new Set(queue.map(({ x, z }) => tileKey(x, z)));
  for (let i = 0; i < queue.length && i < MAX_SEARCH; i++) {
    const { x, z, distance } = queue[i]!;
    if (targets.has(tileKey(x, z))) return distance;
    if (distance >= MAX_DISTANCE) continue;
    for (const [dx, dz] of DIRECTIONS) {
      const xx = x + dx;
      const zz = z + dz;
      const remaining =
        Math.max(targetX0 - xx, xx - targetX1, 0) + Math.max(targetZ0 - zz, zz - targetZ1, 0);
      if (distance + 1 + remaining > MAX_DISTANCE) continue;
      const key = tileKey(xx, zz);
      if (seen.has(key)) continue;
      seen.add(key);
      if (water(xx, zz)) queue.push({ x: xx, z: zz, distance: distance + 1 });
    }
  }
  return undefined;
}
