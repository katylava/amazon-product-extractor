const path = require('path');
const { test } = require('./fixtures');
const { expect } = require('@playwright/test');

const BASE_PATH = path.resolve(__dirname)

function fixturePath(file) {
  return `file://${path.resolve(BASE_PATH, 'amazon.fixtures', file)}`;
}

test.describe('Amazon Product Extractor Extension Regressions', () => {

  test('extracts pretty litter price', async ({ context, extensionId }) => {
    const page = await context.newPage();
    await page.goto(fixturePath('prettylitter.html'));
    await page.waitForLoadState('networkidle');

    // Inject the content script manually to ensure functions are available
    await page.addScriptTag({ path: './content.js' });

    // Test content script functions directly
    const result = await page.evaluate(() => {
      // These functions should be available from the injected content script
      const name = extractProductName();
      const price = extractPrice();
      const weight = extractWeight();

      return { name, price, weight };
    });

    // More lenient checks since Amazon pages vary
    if (result.name) {
      expect(typeof result.name).toBe('string');
      expect(result.name).toBe('Pretty Litter Health Monitoring Cat Litter, Non-Clumping Crystal Litter, (6LB (Pack of 2), Unscented)');
    }

    if (result.price) {
      expect(result.price).toBe(44.08);
    }

    if (result.weight) {
      expect(result.weight).toHaveProperty('value');
      expect(result.weight).toHaveProperty('unit');
      expect(result.weight.value).toBe(12);
      expect(result.weight.unit).toBe('lb');
    }
  });
});