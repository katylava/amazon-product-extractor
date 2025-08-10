function extractProductInfo() {
    try {
        const productInfo = {
            name: null,
            price: null,
            weight: null,
            url: window.location.href,
            pricePerWeight: null
        };

        productInfo.name = extractProductName();
        productInfo.price = extractPrice();
        productInfo.weight = extractWeight();
        
        if (productInfo.price && productInfo.weight) {
            productInfo.pricePerWeight = calculatePricePerWeight(productInfo.price, productInfo.weight);
        }

        return productInfo;
    } catch (error) {
        console.error('Error extracting product info:', error);
        return null;
    }
}

function extractProductName() {
    const selectors = [
        '#productTitle',
        '.product-title',
        '[data-automation-id="product-title"]',
        'h1.a-size-large',
        'h1[data-automation-id="product-title"]',
        '.a-size-large.product-title-word-break'
    ];
    
    for (const selector of selectors) {
        const element = document.querySelector(selector);
        if (element && element.textContent.trim()) {
            return element.textContent.trim();
        }
    }
    
    return null;
}

function extractPrice() {
    const selectors = [
        '.a-price.a-text-price.a-size-medium.apexPriceToPay .a-offscreen',
        '.a-price-whole',
        '.a-price.a-text-price .a-offscreen',
        '.a-price-symbol + .a-price-whole',
        '[data-automation-id="product-price"] .a-price .a-offscreen',
        '.a-price.a-text-normal .a-offscreen',
        '.a-price-current .a-offscreen'
    ];
    
    for (const selector of selectors) {
        const element = document.querySelector(selector);
        if (element && element.textContent.trim()) {
            const priceText = element.textContent.trim();
            const priceMatch = priceText.match(/[\d,]+\.?\d*/);
            if (priceMatch) {
                return parseFloat(priceMatch[0].replace(/,/g, ''));
            }
        }
    }
    
    const wholePriceEl = document.querySelector('.a-price-whole');
    const fractionPriceEl = document.querySelector('.a-price-fraction');
    if (wholePriceEl && fractionPriceEl) {
        const whole = wholePriceEl.textContent.replace(/[^\d]/g, '');
        const fraction = fractionPriceEl.textContent.replace(/[^\d]/g, '');
        if (whole && fraction) {
            return parseFloat(`${whole}.${fraction}`);
        }
    }
    
    return null;
}

function extractWeight() {
    const selectors = [
        '#feature-bullets ul li:contains("Weight")',
        '.a-unordered-list .a-list-item:contains("Weight")',
        '#technicalSpecifications_feature_div tr:contains("Weight")',
        '#detailBullets_feature_div ul li:contains("Weight")',
        '.prodDetTable tr:contains("Weight")',
        '[data-automation-id*="weight"]'
    ];
    
    const textSelectors = [
        '#feature-bullets',
        '#detailBullets_feature_div',
        '#technicalSpecifications_feature_div',
        '.aplus-module',
        '#prodDetails',
        '.prodDetTable'
    ];
    
    for (const selector of textSelectors) {
        const container = document.querySelector(selector);
        if (container) {
            const weightMatch = container.textContent.match(/(?:Weight|weight)[\s\:]*([0-9.,]+)\s*(pounds|lbs?|ounces?|oz|kilograms?|kg|grams?|g)\b/i);
            if (weightMatch) {
                const value = parseFloat(weightMatch[1].replace(/,/g, ''));
                const unit = weightMatch[2].toLowerCase();
                return { value, unit: normalizeWeightUnit(unit) };
            }
        }
    }
    
    const allText = document.body.textContent;
    const patterns = [
        /(?:Weight|weight)[\s\:]*([0-9.,]+)\s*(pounds|lbs?|ounces?|oz|kilograms?|kg|grams?|g)\b/gi,
        /([0-9.,]+)\s*(pounds|lbs?|ounces?|oz|kilograms?|kg|grams?|g)(?:\s+weight)?/gi
    ];
    
    for (const pattern of patterns) {
        const matches = [...allText.matchAll(pattern)];
        for (const match of matches) {
            const value = parseFloat(match[1].replace(/,/g, ''));
            const unit = match[2].toLowerCase();
            if (value > 0) {
                return { value, unit: normalizeWeightUnit(unit) };
            }
        }
    }
    
    return null;
}

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

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'extractProduct') {
        const productInfo = extractProductInfo();
        sendResponse(productInfo);
    }
    return true;
});