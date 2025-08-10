const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

// Set up JSDOM environment
function setupTestEnvironment() {
  const contentScript = fs.readFileSync(path.join(__dirname, '../content.js'), 'utf8');
  
  // Create JSDOM instance
  const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>', {
    url: 'https://amazon.com',
    pretendToBeVisual: true,
    resources: 'usable'
  });

  // Set up globals
  global.window = dom.window;
  global.document = dom.window.document;
  global.navigator = dom.window.navigator;

  // Mock Chrome API
  global.chrome = {
    runtime: {
      onMessage: {
        addListener: jest.fn()
      }
    }
  };

  // Execute content script in global scope
  const script = new dom.window.Function(contentScript);
  script.call(dom.window);

  // Return functions that are now available on window
  return {
    extractPrice: dom.window.extractPrice,
    extractWeight: dom.window.extractWeight,
    extractProductName: dom.window.extractProductName,
    calculatePricePerWeight: dom.window.calculatePricePerWeight,
    normalizeWeightUnit: dom.window.normalizeWeightUnit,
    convertToGrams: dom.window.convertToGrams,
    document: dom.window.document
  };
}

module.exports = { setupTestEnvironment };