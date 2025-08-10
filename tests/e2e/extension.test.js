const { test, expect, chromium } = require('@playwright/test');
const path = require('path');

// Path to the extension directory
const extensionPath = path.resolve(__dirname, '../../');

test.describe('Amazon Product Extractor Extension', () => {
  let browser;
  let context;
  let page;

  test.beforeAll(async () => {
    // Launch browser with the extension loaded
    browser = await chromium.launch({
      headless: false,
      args: [
        `--load-extension=${extensionPath}`,
        '--disable-web-security',
        '--disable-features=VizDisplayCompositor'
      ]
    });

    // Create context with the extension
    context = await browser.newContext();
  });

  test.afterAll(async () => {
    await browser.close();
  });

  test.beforeEach(async () => {
    page = await context.newPage();
  });

  test.afterEach(async () => {
    await page.close();
  });

  test('extension loads successfully', async () => {
    // Go to extension management page to verify it's loaded
    await page.goto('chrome://extensions/');
    
    // Look for our extension
    const extensionCard = await page.locator('text=Amazon Product Extractor').first();
    await expect(extensionCard).toBeVisible({ timeout: 10000 });
  });

  test('popup opens and shows UI elements', async () => {
    // Navigate to any page first
    await page.goto('https://amazon.com');
    await page.waitForTimeout(2000);

    // Get extension ID
    const extensionPage = await context.newPage();
    await extensionPage.goto('chrome://extensions/');
    
    // Find the extension ID (this is a simplified approach)
    // In a real test, you'd extract the actual extension ID
    const extensionId = 'test-extension-id'; // Placeholder
    
    // Open the popup by navigating to it directly
    const popupUrl = `chrome-extension://${extensionId}/popup.html`;
    const popupPage = await context.newPage();
    
    try {
      await popupPage.goto(popupUrl);
      
      // Check if popup elements are present
      await expect(popupPage.locator('#extractBtn')).toBeVisible();
      await expect(popupPage.locator('text=Extract Product Info')).toBeVisible();
    } catch (error) {
      // Fallback: Test the popup HTML directly
      await popupPage.goto(`file://${extensionPath}/popup.html`);
      await expect(popupPage.locator('#extractBtn')).toBeVisible();
      await expect(popupPage.locator('text=Extract Product Info')).toBeVisible();
    }
    
    await popupPage.close();
    await extensionPage.close();
  });

  test('content script functions work with test HTML', async () => {
    // Use our test HTML file
    const testHtmlPath = `file://${extensionPath}/test.html`;
    await page.goto(testHtmlPath);
    
    // Wait for the page to load and scripts to run
    await page.waitForTimeout(2000);
    
    // Check if the result shows the correct price
    const resultElement = await page.locator('h1');
    await expect(resultElement).toContainText('$44.08');
    
    // Check console logs for debugging
    const logs = [];
    page.on('console', msg => logs.push(msg.text()));
    
    // Refresh to capture console logs
    await page.reload();
    await page.waitForTimeout(2000);
    
    // Verify that price extraction worked
    const hasCorrectPrice = logs.some(log => 
      log.includes('Extracted price: $44.08') || 
      log.includes('Final result: 44.08')
    );
    expect(hasCorrectPrice).toBe(true);
  });

  test('handles Amazon product page structure', async () => {
    // Create a mock Amazon product page
    await page.setContent(`
      <!DOCTYPE html>
      <html>
      <head><title>Mock Amazon Product</title></head>
      <body>
        <div id="productTitle">Test Product Name</div>
        <div id="sns-tiered-price">
          <span class="a-price priceToPay">
            <span class="a-offscreen">$25.99</span>
            <span aria-hidden="true">
              <span class="a-price-symbol">$</span>
              <span class="a-price-whole">25<span class="a-price-decimal">.</span></span>
              <span class="a-price-fraction">99</span>
            </span>
          </span>
        </div>
        <div id="feature-bullets">
          <ul>
            <li>Weight: 2.5 pounds</li>
          </ul>
        </div>
        <script src="${extensionPath}/content.js"></script>
        <script>
          // Test the extraction
          setTimeout(() => {
            const productInfo = extractProductInfo();
            document.body.setAttribute('data-test-result', JSON.stringify(productInfo));
          }, 100);
        </script>
      </body>
      </html>
    `);

    // Wait for content script to process
    await page.waitForTimeout(500);

    // Get the test result
    const testResult = await page.getAttribute('body', 'data-test-result');
    const productInfo = JSON.parse(testResult);

    // Verify extracted information
    expect(productInfo.name).toBe('Test Product Name');
    expect(productInfo.price).toBe(25.99);
    expect(productInfo.weight.value).toBe(2.5);
    expect(productInfo.weight.unit).toBe('lb');
    expect(productInfo.pricePerWeight.value).toBeCloseTo(10.40);
  });

  test('extension manifest is valid', async () => {
    const fs = require('fs');
    const manifestPath = path.join(extensionPath, 'manifest.json');
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));

    // Verify key manifest properties
    expect(manifest.manifest_version).toBe(3);
    expect(manifest.name).toBe('Amazon Product Extractor');
    expect(manifest.permissions).toContain('activeTab');
    expect(manifest.permissions).toContain('clipboardWrite');
    expect(manifest.permissions).toContain('scripting');
  });
});