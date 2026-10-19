import { describe, expect, it } from 'vitest';
import { nextTheme } from './theme';

describe('nextTheme', () => {
  it('wechselt reihum Automatisch → Hell → Dunkel → Automatisch', () => {
    expect(nextTheme('auto')).toBe('light');
    expect(nextTheme('light')).toBe('dark');
    expect(nextTheme('dark')).toBe('auto');
  });
});
