const { test } = require('./fixtures');
const { expect } = require('@playwright/test');

test.describe('Amazon Product Extractor Extension', () => {
  test('loads extension correctly', async ({ context, extensionId }) => {
    expect(extensionId).toBeTruthy();
    expect(extensionId).toMatch(/^[a-z]{32}$/);
  });

  test('popup opens and displays extract button', async ({ popup }) => {
    await expect(popup.locator('#extractBtn')).toBeVisible();
    await expect(popup.locator('#extractBtn')).toHaveText('Extract Product Info');
  });

  test('shows error when not on Amazon page', async ({ context, popup }) => {
    const page = await context.newPage();
    await page.goto('https://www.google.com');
    
    await popup.locator('#extractBtn').click();
    await expect(popup.locator('#error')).toBeVisible();
    await expect(popup.locator('#error')).toContainText('Please navigate to an Amazon product page first');
  });

  test('extracts product information from Amazon product page', async ({ context, popup }) => {
    const page = await context.newPage();
    
    // Navigate to a real Amazon product page for testing
    await page.goto('https://www.amazon.com/dp/B08N5WRWNW');
    
    // Wait for page to load
    await page.waitForLoadState('networkidle');
    
    // Click extract button
    await popup.locator('#extractBtn').click();
    
    // Wait for loading to complete
    await expect(popup.locator('#loading')).toBeVisible();
    await expect(popup.locator('#loading')).toBeHidden({ timeout: 10000 });
    
    // Check if results are displayed
    await expect(popup.locator('#results')).toBeVisible();
    
    // Verify product information is extracted
    const productName = popup.locator('#productName');
    await expect(productName).toBeVisible();
    await expect(productName).not.toHaveText('Product name not found');
    
    const price = popup.locator('#price');
    await expect(price).toBeVisible();
    await expect(price).not.toHaveText('Price not found');
  });

  test('copy functionality works', async ({ context, popup }) => {
    const page = await context.newPage();
    await page.goto('https://www.amazon.com/dp/B08N5WRWNW');
    await page.waitForLoadState('networkidle');
    
    // Extract product info first
    await popup.locator('#extractBtn').click();
    await expect(popup.locator('#results')).toBeVisible({ timeout: 10000 });
    
    // Test copy functionality
    await popup.locator('#copyBtn').click();
    
    // Verify copy button changes state
    await expect(popup.locator('#copyBtn')).toContainText('Copied');
  });

  test('handles network errors gracefully', async ({ context, popup }) => {
    const page = await context.newPage();
    
    // Navigate to Amazon but immediately close to simulate network issues
    await page.goto('https://www.amazon.com/dp/B08N5WRWNW');
    await page.close();
    
    await popup.locator('#extractBtn').click();
    
    // Should show error for communication failure
    await expect(popup.locator('#error')).toBeVisible({ timeout: 15000 });
  });

  test('content script functions work correctly', async ({ context, extensionId }) => {
    const page = await context.newPage();
    await page.goto('https://www.amazon.com/dp/B08N5WRWNW');
    await page.waitForLoadState('networkidle');
    
    // Test content script functions directly
    const result = await page.evaluate(() => {
      // These functions should be available from the injected content script
      const name = extractProductName();
      const price = extractPrice();
      const weight = extractWeight();
      
      return { name, price, weight };
    });
    
    expect(result.name).toBeTruthy();
    expect(result.name).not.toBe(null);
    
    if (result.price) {
      expect(result.price).toBeGreaterThan(0);
    }
    
    if (result.weight) {
      expect(result.weight).toHaveProperty('value');
      expect(result.weight).toHaveProperty('unit');
    }
  });

  test('price per weight calculation works', async ({ context }) => {
    const page = await context.newPage();
    await page.goto('https://www.amazon.com/dp/B08N5WRWNW');
    await page.waitForLoadState('networkidle');
    
    const result = await page.evaluate(() => {
      // Test the calculation function directly
      const mockPrice = 10.99;
      const mockWeight = { value: 2, unit: 'lb' };
      
      return calculatePricePerWeight(mockPrice, mockWeight);
    });
    
    if (result) {
      expect(result).toHaveProperty('value');
      expect(result).toHaveProperty('unit');
      expect(result).toHaveProperty('display');
      expect(result.value).toBeCloseTo(5.50, 2);
      expect(result.unit).toBe('lb');
    }
  });
});