import { describe, expect, it } from 'vitest';
import { computeFrameStats, FrameTracker } from '@/ui/debugOverlay';

describe('computeFrameStats', () => {
  it('returns zeros for empty samples', () => {
    const stats = computeFrameStats([], 0);
    expect(stats.fps).toBe(0);
    expect(stats.avgMs).toBe(0);
    expect(stats.p95Ms).toBe(0);
    expect(stats.worstMs).toBe(0);
  });

  it('computes stats for a single sample', () => {
    const stats = computeFrameStats([16], 1);
    expect(stats.avgMs).toBe(16);
    expect(stats.p95Ms).toBe(16);
    expect(stats.worstMs).toBe(16);
    expect(stats.fps).toBeCloseTo(62.5, 1);
  });

  it('computes stats for uniform 60 FPS frames over 500 ms', () => {
    const frameTime = 1000 / 60; // ~16.667 ms
    const samples = new Array(30).fill(frameTime);
    const stats = computeFrameStats(samples, samples.length, 500);

    expect(stats.fps).toBeCloseTo(60, 1);
    expect(stats.avgMs).toBeCloseTo(frameTime, 2);
    expect(stats.p95Ms).toBeCloseTo(frameTime, 2);
    expect(stats.worstMs).toBeCloseTo(frameTime, 2);
  });

  it('correctly calculates avg, p95 and worst on uneven frame times', () => {
    // 100 samples: 95 samples of 10ms, 4 samples of 20ms, 1 spike of 100ms
    const samples: number[] = [];
    for (let i = 0; i < 95; i++) samples.push(10);
    for (let i = 0; i < 4; i++) samples.push(20);
    samples.push(100);

    const stats = computeFrameStats(samples, samples.length);

    // Sum = 95*10 + 4*20 + 100 = 950 + 80 + 100 = 1130 ms
    // Avg = 1130 / 100 = 11.3 ms
    expect(stats.avgMs).toBeCloseTo(11.3, 2);
    expect(stats.worstMs).toBe(100);

    // For 100 samples, index 94 (95th item) is 10. Index 95 is 20.
    // 95% of frames are <= 10ms or <= 20ms depending on index definition.
    // With ceil(100 * 0.95) - 1 = 94, sorted[94] = 10.
    expect(stats.p95Ms).toBe(10);

    // FPS = 100 / (1.13 s) ~ 88.5 FPS
    expect(stats.fps).toBeCloseTo(100 / 1.13, 1);
  });

  it('computes p95 when spike is in the top 5%', () => {
    // 100 samples: 90 samples of 16ms, 10 samples of 50ms
    const samples: number[] = [];
    for (let i = 0; i < 90; i++) samples.push(16);
    for (let i = 0; i < 10; i++) samples.push(50);

    const stats = computeFrameStats(samples, samples.length);
    expect(stats.p95Ms).toBe(50);
    expect(stats.worstMs).toBe(50);
  });

  it('uses elapsedMs when provided', () => {
    const samples = [10, 10, 10, 10, 10]; // 5 frames, total 50ms
    // If elapsed wall-clock was 1000ms:
    const stats = computeFrameStats(samples, 5, 1000);
    expect(stats.fps).toBe(5); // 5 frames in 1 second
  });
});

describe('FrameTracker', () => {
  it('records frame durations without errors and resets', () => {
    const tracker = new FrameTracker(16);
    expect(tracker.currentCount).toBe(0);

    tracker.record(16.0);
    tracker.record(17.0);
    tracker.record(15.0);
    expect(tracker.currentCount).toBe(3);

    const stats = tracker.compute(50);
    expect(stats.avgMs).toBeCloseTo(16.0, 1);
    expect(stats.worstMs).toBe(17.0);

    tracker.reset();
    expect(tracker.currentCount).toBe(0);
    const emptyStats = tracker.compute();
    expect(emptyStats.fps).toBe(0);
  });

  it('handles overflow beyond capacity gracefully', () => {
    const tracker = new FrameTracker(4);
    for (let i = 0; i < 10; i++) {
      tracker.record(10 + i);
    }
    expect(tracker.currentCount).toBe(10);

    const stats = tracker.compute();
    // worstMs recorded in the stream should be 19
    expect(stats.worstMs).toBe(19);
  });
});
