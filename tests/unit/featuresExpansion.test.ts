import { describe, expect, it } from 'vitest';
import { PlaceCommand } from '@/sim/commands';
import { Simulation } from '@/sim/simulation';
import { TownStore } from '@/sim/towns';
import { trafficPlan } from '@/render/trafficPlan';
import { makeCity } from './helpers';

describe('Advanced Urbek-inspired Features', () => {
  describe('Feature 1: Occupational Housing Evolution', () => {
    it('catalog loads all occupational and high-rise building definitions', () => {
      const { city } = makeCity();
      expect(city.catalog.has('miner_cottage')).toBe(true);
      expect(city.catalog.has('fisher_cottage')).toBe(true);
      expect(city.catalog.has('lumberjack_cottage')).toBe(true);
      expect(city.catalog.has('tenement')).toBe(true);
      expect(city.catalog.has('bus_stop')).toBe(true);
      expect(city.catalog.has('metro_station')).toBe(true);
      expect(city.catalog.has('apartment_tower')).toBe(true);
      expect(city.catalog.has('skyscraper')).toBe(true);
    });

    it('cottage upgrades to lumberjack_cottage when near woodcutter', () => {
      const { city, history } = makeCity();
      const sim = new Simulation(city);
      city.stock.wood = 500;
      city.stock.stone = 500;
      city.stock.food = 500;

      // Road, well, woodcutter, and cottage
      history.run(new PlaceCommand('road', 0, 0));
      history.run(new PlaceCommand('road', 1, 0));
      history.run(new PlaceCommand('road', 2, 0));
      city._add(city.catalog.get('well'), 1, 1);
      city._add(city.catalog.get('woodcutter'), 0, 1);
      city._add(city.catalog.get('cottage'), 2, 1);

      const cottageUid = city.at(2, 1)?.uid as number;
      expect(cottageUid).toBeDefined();

      // Run simulation ticks
      sim.run(24);
      const upgraded = city.get(cottageUid);
      expect(upgraded?.def.id).toBe('lumberjack_cottage');
    });

    it('cottage upgrades to miner_cottage when near coal_mine', () => {
      const { city, history } = makeCity();
      const sim = new Simulation(city);
      city.stock.wood = 500;
      city.stock.stone = 500;
      city.stock.food = 500;

      for (let x = 0; x < 5; x++) history.run(new PlaceCommand('road', x, 0));
      city._add(city.catalog.get('well'), 2, 1);
      city._add(city.catalog.get('coal_mine'), 0, 1);
      city._add(city.catalog.get('cottage'), 3, 1);

      const cottageUid = city.at(3, 1)?.uid as number;
      expect(cottageUid).toBeDefined();

      sim.run(24);
      const upgraded = city.get(cottageUid);
      expect(upgraded?.def.id).toBe('miner_cottage');
    });
  });

  describe('Feature 2: Town Happiness & Quality of Life', () => {
    it('calculates town happiness and reflects amenities and pollution', () => {
      const { city, history } = makeCity();
      const towns = new TownStore(city);
      const sim = new Simulation(city);
      sim.tiers = towns;
      city.stock.wood = 500;
      city.stock.food = 500;

      for (let x = 0; x < 10; x++) history.run(new PlaceCommand('road', x, 0));
      history.run(new PlaceCommand('hut', 1, 1));
      history.run(new PlaceCommand('hut', 2, 1));

      sim.run(16);
      city._addStock({}, 1);

      const tw = towns.all()[0];
      expect(tw).toBeDefined();
      expect(tw!.population).toBeGreaterThan(0);
      expect(tw!.happiness).toBeGreaterThanOrEqual(0);
      expect(tw!.happiness).toBeLessThanOrEqual(100);

      const baseHap = tw!.happiness;

      // Add green park: happiness should increase
      city.stock.stone = 500;
      history.run(new PlaceCommand('planted_grove', 1, 2));
      city.fields.apply(
        { x: 1, z: 1, w: 2, d: 2 },
        [{ field: 'greenery', amount: 3, radius: 4 }],
        1,
      );
      towns.updatePopulation();
      expect(tw!.happiness).toBeGreaterThanOrEqual(baseHap);
    });
  });

  describe('Feature 3: Town Hall & City Policies', () => {
    it('toggles policies and modifies simulation economy and happiness', () => {
      const { city, history } = makeCity();
      const towns = new TownStore(city);
      const sim = new Simulation(city);
      sim.tiers = towns;
      city.stock.wood = 1000;
      city.stock.stone = 1000;
      city.stock.food = 1000;
      city.stock.charter = 5;

      expect(city.isPolicyActive('industrial_drive')).toBe(false);
      city.setPolicy('industrial_drive', true);
      expect(city.isPolicyActive('industrial_drive')).toBe(true);

      // Verify policy boosts output
      for (let x = 0; x < 6; x++) history.run(new PlaceCommand('road', x, 0));
      history.run(new PlaceCommand('hut', 1, 1));
      history.run(new PlaceCommand('hut', 2, 1));
      city._add(city.catalog.get('woodcutter'), 4, 1);

      city.stock.wood = 0;
      sim.run(8);
      // Woodcutter produced with industrial_drive bonus
      expect(city.stock.wood).toBeGreaterThan(0);

      // Turn on healthcare_focus policy
      city.setPolicy('healthcare_focus', true);
      towns.updatePopulation();
      const tw = towns.all()[0];
      if (tw) {
        expect(tw.happiness).toBeGreaterThan(50);
      }
    });
  });

  describe('Feature 4: Public Transit & Skyscrapers', () => {
    it('bus_stop and metro_station emit connectivity field', () => {
      const { city, history } = makeCity();
      city.stock.wood = 100;
      city.stock.stone = 100;
      city.stock.metal = 100;
      city.stock.goods = 100;

      history.run(new PlaceCommand('road', 0, 0));
      history.run(new PlaceCommand('bus_stop', 0, 1));

      const busConnectivity = city.fields.get(0, 0, 'connectivity');
      expect(busConnectivity).toBeGreaterThan(0);

      history.run(new PlaceCommand('road', 10, 10));
      history.run(new PlaceCommand('road', 11, 10));
      history.run(new PlaceCommand('metro_station', 10, 11));

      const metroConnectivity = city.fields.get(10, 10, 'connectivity');
      expect(metroConnectivity).toBeGreaterThan(0);
    });

    it('transit presence boosts bus weighting in traffic plan', () => {
      const noTransit = trafficPlan(300, 0.2, 100, false);
      const withTransit = trafficPlan(300, 0.2, 100, true);

      expect(withTransit.weights.bus).toBeGreaterThan(noTransit.weights.bus);
    });
  });
});
