/**
 * @jest-environment jsdom
 */

describe('Price Extraction Logic', () => {
  // Define functions inline for testing
  function normalizeWeightUnit(unit) {
    const unitMap = {
      'pound': 'lb',
      'pounds': 'lb',
      'lbs': 'lb',
      'lb': 'lb',
      'ounce': 'oz',
      'ounces': 'oz',
      'oz': 'oz',
      'kilogram': 'kg',
      'kilograms': 'kg',
      'kg': 'kg',
      'gram': 'g',
      'grams': 'g',
      'g': 'g'
    };
    return unitMap[unit.toLowerCase()] || unit;
  }

  function convertToGrams(weight) {
    const conversions = {
      'lb': 453.592,
      'oz': 28.3495,
      'kg': 1000,
      'g': 1
    };
    return weight.value * (conversions[weight.unit] || 1);
  }

  function calculatePricePerWeight(price, weight) {
    if (!price || !weight || !weight.value) return null;
    
    const pricePerGram = price / convertToGrams(weight);
    
    let pricePerUnit, displayUnit;
    
    switch (weight.unit) {
      case 'lb':
        pricePerUnit = pricePerGram * 453.592;
        displayUnit = 'lb';
        break;
      case 'oz':
        pricePerUnit = pricePerGram * 28.3495;
        displayUnit = 'oz';
        break;
      case 'kg':
        pricePerUnit = pricePerGram * 1000;
        displayUnit = 'kg';
        break;
      case 'g':
        pricePerUnit = pricePerGram;
        displayUnit = 'g';
        break;
      default:
        pricePerUnit = pricePerGram;
        displayUnit = weight.unit;
    }
    
    return {
      value: parseFloat(pricePerUnit.toFixed(2)),
      unit: displayUnit,
      display: `$${pricePerUnit.toFixed(2)}/${displayUnit}`
    };
  }

  function extractPriceFromDOM() {
    // Test the specific selector that works
    const element = document.querySelector('#sns-tiered-price .a-price .a-offscreen');
    if (element && element.textContent.trim()) {
      const priceText = element.textContent.trim();
      const priceMatch = priceText.match(/[\d,]+\.?\d*/);
      if (priceMatch) {
        return parseFloat(priceMatch[0].replace(/,/g, ''));
      }
    }
    return null;
  }

  beforeEach(() => {
    document.body.innerHTML = '';
  });

  test('normalizes weight units correctly', () => {
    expect(normalizeWeightUnit('pounds')).toBe('lb');
    expect(normalizeWeightUnit('ounces')).toBe('oz');
    expect(normalizeWeightUnit('kilograms')).toBe('kg');
    expect(normalizeWeightUnit('grams')).toBe('g');
    expect(normalizeWeightUnit('lbs')).toBe('lb');
  });

  test('converts weights to grams', () => {
    expect(convertToGrams({ value: 1, unit: 'lb' })).toBeCloseTo(453.592);
    expect(convertToGrams({ value: 1, unit: 'oz' })).toBeCloseTo(28.3495);
    expect(convertToGrams({ value: 1, unit: 'kg' })).toBe(1000);
    expect(convertToGrams({ value: 100, unit: 'g' })).toBe(100);
  });

  test('calculates price per weight correctly', () => {
    const result = calculatePricePerWeight(44.08, { value: 8, unit: 'lb' });
    expect(result.value).toBeCloseTo(5.51);
    expect(result.unit).toBe('lb');
    expect(result.display).toBe('$5.51/lb');
  });

  test('calculates price per ounce correctly', () => {
    const result = calculatePricePerWeight(10.00, { value: 16, unit: 'oz' });
    expect(result.value).toBeCloseTo(0.63);
    expect(result.unit).toBe('oz');
    expect(result.display).toBe('$0.63/oz');
  });

  test('returns null for invalid price calculation inputs', () => {
    expect(calculatePricePerWeight(null, { value: 5, unit: 'lb' })).toBeNull();
    expect(calculatePricePerWeight(10, null)).toBeNull();
    expect(calculatePricePerWeight(10, { value: 0, unit: 'lb' })).toBeNull();
  });

  test('extracts price from correct Amazon structure', () => {
    document.body.innerHTML = `
      <div id="sns-tiered-price">
        <span class="a-price priceToPay">
          <span class="a-offscreen">$44.08</span>
        </span>
      </div>
    `;

    const price = extractPriceFromDOM();
    expect(price).toBe(44.08);
  });

  test('handles prices with commas', () => {
    document.body.innerHTML = `
      <div id="sns-tiered-price">
        <span class="a-price">
          <span class="a-offscreen">$1,234.56</span>
        </span>
      </div>
    `;

    const price = extractPriceFromDOM();
    expect(price).toBe(1234.56);
  });

  test('returns null when no price found', () => {
    document.body.innerHTML = '<div>No price here</div>';
    
    const price = extractPriceFromDOM();
    expect(price).toBeNull();
  });
});