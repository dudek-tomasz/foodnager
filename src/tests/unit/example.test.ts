import { describe, it, expect } from 'vitest';

/**
 * Example unit test
 * This demonstrates basic Vitest usage
 */
describe('Example Unit Test', () => {
  it('should pass a simple assertion', () => {
    expect(1 + 1).toBe(2);
  });

  it('should work with async code', async () => {
    const promise = Promise.resolve('hello');
    await expect(promise).resolves.toBe('hello');
  });

  it('should handle arrays', () => {
    const arr = [1, 2, 3];
    expect(arr).toHaveLength(3);
    expect(arr).toContain(2);
  });

  it('should handle objects', () => {
    const obj = { name: 'Test', value: 42 };
    expect(obj).toHaveProperty('name');
    expect(obj.name).toBe('Test');
  });
});

