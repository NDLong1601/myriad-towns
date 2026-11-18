import { describe, expect, it } from 'vitest';
import { type BufferGeometry, Mesh, MeshBasicMaterial, Raycaster, Vector3 } from 'three';
import { type SaveMeta, applySave, takeSave } from '@/io/save';
import { architectureModel } from '@/render/architectureModels';
import { buildingGeometry } from '@/render/buildingModels';
import { isRoadDef, loadCatalog } from '@/sim/catalog';
import { footprintOf } from '@/sim/city';
import { PlaceCommand } from '@/sim/commands';
import { PoiStore } from '@/sim/poi';
import { Simulation } from '@/sim/simulation';
import { TownStore } from '@/sim/towns';
import { makeCity } from './helpers';

const catalog = loadCatalog();

describe('building architecture', () => {
  it(
    'keeps every catalogue building and crop stage renderable as one bounded mesh',
    { timeout: 20000 },
    () => {
      for (const def of catalog.defs) {
        const variants = def.crop ? [1, 2, 3, 4] : [0, 15];
        for (const variant of variants) {
          const geometry = buildingGeometry(def, variant);
          geometry.computeBoundingBox();
          const { min, max } = geometry.boundingBox!;
          expect.soft(min.x, def.id).toBeGreaterThanOrEqual(-0.001);
          expect.soft(min.z, def.id).toBeGreaterThanOrEqual(-0.001);
          expect.soft(max.x, def.id).toBeLessThanOrEqual(def.footprint.w + 0.001);
          expect.soft(max.z, def.id).toBeLessThanOrEqual(def.footprint.d + 0.001);
          expect(geometry.getAttribute('position').count, def.id).toBeGreaterThan(0);
          expect(geometry.getAttribute('normal').count, def.id).toBe(
            geometry.getAttribute('glow').count,
          );
        }
      }
    },
  );

  it('gives every ordinary catalogue building its own model within its lot', () => {
    const specialistModels: string[] = [];
    for (const def of catalog.defs) {
      if (def.crop || isRoadDef(def) || specialistModels.includes(def.id)) continue;
      const parts: BufferGeometry[] = [];
      expect(architectureModel(def, parts), def.id).toBe(true);
      expect(parts.length, def.id).toBeGreaterThan(2);
      for (const part of parts) part.dispose();

      const model = buildingGeometry(def);
      model.computeBoundingBox();
      const bounds = model.boundingBox!;
      expect.soft(bounds.min.x, def.id).toBeGreaterThanOrEqual(-0.001);
      expect.soft(bounds.min.z, def.id).toBeGreaterThanOrEqual(-0.001);
      expect.soft(bounds.max.x, def.id).toBeLessThanOrEqual(def.footprint.w + 0.001);
      expect.soft(bounds.max.z, def.id).toBeLessThanOrEqual(def.footprint.d + 0.001);
      expect(model.getAttribute('glow').count, def.id).toBe(model.getAttribute('position').count);
    }
  });

  it('makes similar-sized buildings distinguishable by shape alone', () => {
    const material = new MeshBasicMaterial();
    const ray = new Raycaster();
    const down = new Vector3(0, -1, 0);
    const start = new Vector3();
    for (const group of [
      ['hut', 'cottage', 'yurt', 'fisher_hut', 'log_cabin', 'mountain_hut'],
      ['market', 'town_hall', 'warehouse', 'grain_store', 'granary'],
      ['workshop', 'smelter', 'brickworks', 'foundry', 'power_plant'],
      ['rail_station', 'metro_station', 'ferry_pier', 'fishing_harbor'],
    ]) {
      const signatures = group.map((id) => {
        const def = catalog.get(id);
        const mesh = new Mesh(buildingGeometry(def), material);
        mesh.geometry.computeBoundingBox();
        const max = mesh.geometry.boundingBox!.max.y;
        const samples: number[] = [];
        for (let z = 0; z < 7; z++) {
          for (let x = 0; x < 7; x++) {
            start.set(
              ((x + 0.5) * def.footprint.w) / 7,
              max + 1,
              ((z + 0.5) * def.footprint.d) / 7,
            );
            ray.set(start, down);
            const hit = ray.intersectObject(mesh)[0];
            samples.push(hit ? Math.round((hit.point.y / max) * 10) : 0);
          }
        }
        return samples.join(',');
      });
      expect(new Set(signatures).size, group.join(', ')).toBe(group.length);
    }
    material.dispose();
  });

  it('rotates a merged housing row onto the matching orientation', () => {
    for (const type of ['artisan_row', 'terrace_residence']) {
      const east = buildingGeometry(catalog.get(`${type}_east`)).getAttribute('position');
      const south = buildingGeometry(catalog.get(`${type}_south`)).getAttribute('position');
      expect(south.count).toBe(east.count);
      for (let i = 0; i < east.count; i++) {
        expect(south.getX(i)).toBeCloseTo(1 - east.getZ(i), 5);
        expect(south.getY(i)).toBeCloseTo(east.getY(i), 5);
        expect(south.getZ(i)).toBeCloseTo(east.getX(i), 5);
      }
    }
  });

  it('gives each multi-tier civic and production chain (3 to 7 tiers) progressive height and upgrades/declines when conditions change', () => {
    const chains: readonly (readonly string[])[] = [
      ['market', 'covered_market', 'grand_bazaar'],
      ['tavern', 'guild_tavern', 'grand_inn'],
      ['town_hall', 'civic_hall', 'magistrate_palace'],
      ['chapel', 'parish_church', 'sanctuary_chapel'],
      ['clinic', 'infirmary', 'medical_hall'],
      ['school', 'grammar_school', 'academy'],
      ['public_library', 'grand_library', 'royal_archive'],
      ['open_air_stage', 'playhouse', 'opera_house'],
      [
        'wheat_farm',
        'irrigated_wheat',
        'windmill_farm_estate',
        'mechanized_granary_farm',
        'imperial_agricultural_estate',
        'agro_industrial_complex',
        'hydroponic_mega_farm',
      ],
      [
        'berry_field',
        'market_garden',
        'orchard_estate',
        'vineyard_winery',
        'grand_chateau_vineyard',
      ],
      [
        'pasture',
        'dairy_farm',
        'cheese_manufactory_ranch',
        'stud_farm_estate',
        'imperial_livestock_domain',
      ],
      [
        'fishing_dock',
        'smokery_fishery',
        'trawler_wharf',
        'seafood_exchange',
        'cannery_harbor_complex',
      ],
      ['hunting_lodge', 'gamekeeper_lodge', 'falconry_manor', 'royal_hunting_palace'],
      [
        'smelter',
        'bellows_smelter',
        'reverberatory_furnace',
        'blast_furnace',
        'bessemer_converter',
        'electric_arc_smelter',
        'metallurgical_spire',
      ],
      [
        'workshop',
        'guild_workshop',
        'waterwheel_workshop',
        'steam_manufactory',
        'precision_manufactory',
        'grand_artificery',
      ],
      ['bakery', 'market_bakery', 'guild_bakery', 'patisserie_salon', 'royal_confectionery'],
      ['sawmill', 'flume_sawmill', 'timber_mill', 'steam_sawmill', 'lumber_works'],
      ['windmill', 'smock_windmill', 'stone_windmill', 'multi_vane_mill', 'wind_turbine_spire'],
      ['brickworks', 'downdraft_kiln', 'kiln_works', 'tunnel_kiln_works', 'ceramics_manufactory'],
      [
        'hut',
        'cottage',
        'gable_homestead',
        'townhouse',
        'tenement',
        'boulevard_mansion',
        'metropolitan_residence',
      ],
      ['villa', 'manor_estate', 'apartment_tower', 'grand_condominium', 'skyscraper'],
      ['fisher_hut', 'fisher_cottage', 'harbor_inn_house', 'maritime_guild_house'],
      ['cottage', 'miner_cottage', 'master_miner_lodge'],
      ['cottage', 'lumberjack_cottage', 'forester_manor'],
      ['cottage', 'worker_dormitory'],
      ['townhouse', 'scholar_salon_house'],
      ['townhouse', 'merchant_arcade_house'],
      ['well', 'cistern_well', 'pump_house', 'water_tower', 'aqueduct_reservoir'],
      ['warehouse', 'distribution_depot', 'automated_logistics_hub'],
      ['granary', 'elevator_granary', 'imperial_food_exchange'],
      ['bus_stop', 'tram_pavilion', 'grand_transit_kiosk'],
      ['metro_station', 'central_metro_plaza', 'grand_terminus'],
      ['lighthouse', 'harbor_beacon_tower', 'imperial_pharos'],
      ['cargo_port', 'trade_harbor', 'imperial_seaport'],
      ['park', 'promenade_park', 'sculpture_park', 'crystal_conservatory_park'],
      ['quarry', 'steam_quarry', 'industrial_quarry'],
      ['clay_pit', 'brick_works', 'industrial_brickyard'],
      ['iron_mine', 'shaft_iron_mine', 'deep_iron_mine'],
      ['rail_track', 'iron_rail_track'],
      ['power_plant', 'steam_powerhouse', 'turbine_power_station'],
      ['foundry', 'heavy_foundry'],
      ['steelworks', 'bessemer_steelworks', 'integrated_steel_mill'],
      ['coal_mine', 'colliery_headframe', 'deep_shaft_colliery'],
    ];

    for (const chain of chains) {
      for (let i = 1; i < chain.length; i++) {
        const prev = chain[i - 1]!;
        const curr = chain[i]!;
        const gPrev = buildingGeometry(catalog.get(prev));
        const gCurr = buildingGeometry(catalog.get(curr));
        gPrev.computeBoundingBox();
        gCurr.computeBoundingBox();
        expect(gCurr.boundingBox!.max.y, `${curr} > ${prev}`).toBeGreaterThan(
          gPrev.boundingBox!.max.y,
        );
      }
    }

    // Verify in-place upgrade from tavern -> guild_tavern -> grand_inn and decline back
    const { city } = makeCity({ sandbox: true });
    const sim = new Simulation(city);
    city.stock.food = 500;
    city.stock.goods = 500;
    city._add(city.catalog.get('townhouse'), 0, 2);
    city._add(city.catalog.get('townhouse'), 1, 2);
    city._add(city.catalog.get('stone_road'), 0, 1);
    const pub = city._add(city.catalog.get('tavern'), 0, 0).building;
    const rect = { x: 0, z: 0, w: 1, d: 1 };

    city.fields.apply(
      rect,
      [
        { field: 'commerce', amount: 2, radius: 1 },
        { field: 'water_access', amount: 1, radius: 1 },
      ],
      1,
    );
    sim.run(16);
    expect(city.get(pub.uid)?.def.id).toBe('guild_tavern');

    city.fields.apply(
      rect,
      [
        { field: 'urban', amount: 5, radius: 1 },
        { field: 'commerce', amount: 1, radius: 1 },
      ],
      1,
    );
    sim.run(16);
    expect(city.get(pub.uid)?.def.id).toBe('grand_inn');

    // Introduce pollution: grand_inn warns and declines to guild_tavern, then to tavern when water_access is lost
    city.fields.apply(rect, [{ field: 'pollution', amount: 2, radius: 1 }], 1);
    sim.run(120);
    expect(city.get(pub.uid)?.def.id).toBe('guild_tavern');

    city.fields.apply(rect, [{ field: 'water_access', amount: 1, radius: 1 }], -1);
    sim.run(120);
    expect(city.get(pub.uid)?.def.id).toBe('tavern');
  });

  it('details all four directional facades (+Z, -Z, +X, -X) across housing, civic, production, and infrastructure buildings', () => {
    const fourSidedIds = [
      // Housing
      'hut',
      'cottage',
      'gable_homestead',
      'townhouse',
      'tenement',
      'boulevard_mansion',
      'metropolitan_residence',
      'worker_dormitory',
      'scholar_salon_house',
      'merchant_arcade_house',
      'villa',
      'manor_estate',
      'apartment_tower',
      'grand_condominium',
      'skyscraper',
      'fisher_hut',
      'fisher_cottage',
      'harbor_inn_house',
      'maritime_guild_house',
      'miner_cottage',
      'master_miner_lodge',
      'lumberjack_cottage',
      'forester_manor',
      // Civic
      'market',
      'covered_market',
      'grand_bazaar',
      'tavern',
      'guild_tavern',
      'grand_inn',
      'town_hall',
      'civic_hall',
      'magistrate_palace',
      'chapel',
      'parish_church',
      'sanctuary_chapel',
      'clinic',
      'infirmary',
      'medical_hall',
      'school',
      'grammar_school',
      'academy',
      'public_library',
      'grand_library',
      'royal_archive',
      // Production
      'smelter',
      'blast_furnace',
      'metallurgical_spire',
      'workshop',
      'steam_manufactory',
      'grand_artificery',
      'bakery',
      'royal_confectionery',
      'sawmill',
      'lumber_works',
      'windmill',
      'wind_turbine_spire',
      'brickworks',
      'ceramics_manufactory',
      // Infrastructure, Storage, Transit, Harbors & Parks
      'well',
      'cistern_well',
      'pump_house',
      'water_tower',
      'aqueduct_reservoir',
      'warehouse',
      'distribution_depot',
      'automated_logistics_hub',
      'granary',
      'elevator_granary',
      'imperial_food_exchange',
      'bus_stop',
      'tram_pavilion',
      'grand_transit_kiosk',
      'metro_station',
      'central_metro_plaza',
      'grand_terminus',
      'lighthouse',
      'harbor_beacon_tower',
      'imperial_pharos',
      'cargo_port',
      'trade_harbor',
      'imperial_seaport',
      'park',
      'promenade_park',
      'sculpture_park',
      'crystal_conservatory_park',
      // Mining, Extraction & Rail Transit
      'quarry',
      'steam_quarry',
      'industrial_quarry',
      'clay_pit',
      'brick_works',
      'industrial_brickyard',
      'iron_mine',
      'shaft_iron_mine',
      'deep_iron_mine',
      'rail_track',
      'iron_rail_track',
      // Heavy industry & energy
      'power_plant',
      'steam_powerhouse',
      'turbine_power_station',
      'foundry',
      'heavy_foundry',
      'factory',
      'steelworks',
      'bessemer_steelworks',
      'integrated_steel_mill',
      'coal_mine',
      'colliery_headframe',
      'deep_shaft_colliery',
    ];
    for (const id of fourSidedIds) {
      const def = catalog.get(id);
      const geom = buildingGeometry(def);
      const pos = geom.getAttribute('position');
      const glow = geom.getAttribute('glow');
      const norm = geom.getAttribute('normal');
      let northLit = false;
      let southLit = false;
      let eastLit = false;
      let westLit = false;
      for (let i = 0; i < pos.count; i++) {
        if (glow.getX(i) < 0.5) continue;
        const nx = norm.getX(i);
        const nz = norm.getZ(i);
        if (nz > 0.7) southLit = true;
        if (nz < -0.7) northLit = true;
        if (nx > 0.7) eastLit = true;
        if (nx < -0.7) westLit = true;
      }
      expect(southLit, `${id} +Z (South)`).toBe(true);
      expect(northLit, `${id} -Z (North)`).toBe(true);
      expect(eastLit, `${id} +X (East)`).toBe(true);
      expect(westLit, `${id} -X (West)`).toBe(true);
    }
  });

  it('supports 4-way building rotation (rot 0..3), swaps rectangular footprints, and preserves rotation across upgrades and saves', () => {
    const { city } = makeCity({ sandbox: true });
    city._add(city.catalog.get('road'), 2, 2);
    // School is 2x1 at rot 0/2, and 1x2 at rot 1/3
    const cmd = new PlaceCommand('school', 2, 3, 1);
    expect(cmd.do(city)).toBe(true);
    const placed = city.at(2, 3);
    expect(placed).toBeDefined();
    expect(placed?.rot).toBe(1);
    expect(footprintOf(placed!.def, placed!.rot)).toEqual({ w: 1, d: 2 });
    expect(city.at(2, 4)?.uid).toBe(placed?.uid);
    expect(city.at(3, 3)).toBeUndefined();

    // Preserves rot across in-place upgrade
    city._replace(placed!.uid, city.catalog.get('grammar_school'));
    expect(city.get(placed!.uid)?.rot).toBe(1);

    // Preserves rot across save/load round-trip
    const sim = new Simulation(city);
    const towns = new TownStore(city);
    const pois = new PoiStore(city, 42);
    const meta: SaveMeta = {
      name: 'test',
      mode: 'sandbox',
      seed: 'x',
      sandbox: { unlockAll: true, freeBuild: true, noDecline: false },
      createdAt: 1,
      updatedAt: 2,
    };
    const save = takeSave({ city, sim, towns, pois }, meta, null);
    const { city: loadedCity } = makeCity({ sandbox: true });
    const loadedSim = new Simulation(loadedCity);
    const loadedTowns = new TownStore(loadedCity);
    const loadedPois = new PoiStore(loadedCity, 42);
    applySave({ city: loadedCity, sim: loadedSim, towns: loadedTowns, pois: loadedPois }, save);
    const restored = loadedCity.at(2, 3);
    expect(restored?.def.id).toBe('grammar_school');
    expect(restored?.rot).toBe(1);
    expect(loadedCity.at(2, 4)?.uid).toBe(restored?.uid);
  });
});

describe('theatre chain', () => {
  it('bakes contact shadows into walls but keeps windows at full glow colour', () => {
    const def = catalog.get('opera_house');
    const parts: BufferGeometry[] = [];
    architectureModel(def, parts);
    let darkened = 0;
    for (const part of parts) {
      const glow = part.getAttribute('glow');
      const color = part.getAttribute('color');
      const pos = part.getAttribute('position');
      for (let i = 0; i < pos.count; i++) {
        if (glow.getX(i) > 0) expect(color.getX(i) + color.getY(i)).toBeGreaterThan(1);
        else if (pos.getY(i) < 0.05 && color.getX(i) < 0.75) darkened++;
      }
      part.dispose();
    }
    expect(darkened).toBeGreaterThan(0);
  });
});

describe('group 5 food chains', () => {
  it('gates every tier after the first on a rising urban level', () => {
    const chains: readonly [string, number][] = [
      ['irrigated_wheat', 6],
      ['berry_field', 5],
      ['pasture', 5],
      ['fishing_dock', 5],
      ['hunting_lodge', 4],
    ];
    for (const [first, length] of chains) {
      let def = catalog.get(first);
      let tiers = 1;
      let last = -1;
      while (def.upgrades?.length) {
        const up = def.upgrades[0]!;
        const urban = up.when.find((c) => c.type === 'field' && c.field === 'urban');
        expect(urban, def.id).toBeDefined();
        const min = (urban as { min: number }).min;
        expect(min, def.id).toBeGreaterThan(last);
        last = min;
        const next = catalog.get(up.to);
        if (next.tags?.includes('upgrade_only')) expect(next.decline?.to, next.id).toBe(def.id);
        expect(next.footprint, next.id).toEqual(def.footprint);
        def = next;
        tiers++;
      }
      expect(tiers, first).toBe(length);
    }
  });

  it('grows crop fields in the detailed farm models', () => {
    const def = catalog.get('wheat_farm');
    const heights = [1, 2, 3, 4].map((stage) => {
      const parts: BufferGeometry[] = [];
      architectureModel(def, parts, stage);
      // Total crop height over the wheat field in front of the barn.
      let total = 0;
      for (const p of parts) {
        p.computeBoundingBox();
        const b = p.boundingBox!;
        if (b.min.x > 1.0 && b.min.z > 1.0 && b.max.x < 1.9 && b.max.z < 1.9) total += b.max.y;
        p.dispose();
      }
      return total;
    });
    for (let i = 1; i < heights.length; i++) expect(heights[i]).toBeGreaterThan(heights[i - 1]!);
  });
});
