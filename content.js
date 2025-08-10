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
    // Priority order: most specific to most general selectors
    const selectors = [
        // Highest priority: specific selectors for the correct price
        '#sns-tiered-price .priceToPay .a-offscreen',
        '.priceToPay .a-offscreen',
        '#sns-tiered-price .a-price .a-offscreen',
        
        // Current price selectors (medium priority)
        '.a-price.a-text-price.a-size-medium.apexPriceToPay .a-offscreen',
        '.a-price-current .a-offscreen',
        '[data-automation-id="product-price"] .a-price .a-offscreen',
        
        // Skip problematic selector that returns $4.08
        // '.a-price.a-text-price .a-offscreen',  // COMMENTED OUT - returns wrong price
        
        // Alternative current price selectors
        '.a-price.a-text-normal .a-offscreen',
        '.a-price .a-offscreen'
    ];
    
    // Try each selector in priority order
    for (const selector of selectors) {
        const element = document.querySelector(selector);
        if (element && element.textContent.trim()) {
            const priceText = element.textContent.trim();
            console.log(`Found price with selector "${selector}": "${priceText}"`);
            
            // Extract price from text (handle formats like $44.08, 44.08, etc.)
            const priceMatch = priceText.match(/[\d,]+\.?\d*/);
            if (priceMatch) {
                const price = parseFloat(priceMatch[0].replace(/,/g, ''));
                // Skip unreasonably low prices (likely fragments)
                if (price >= 0.01) {
                    console.log(`Extracted price: $${price}`);
                    return price;
                }
            }
        }
    }
    
    // Try to find Amazon's specific price structure
    const priceElements = document.querySelectorAll('.a-price');
    for (const priceEl of priceElements) {
        const wholePriceEl = priceEl.querySelector('.a-price-whole');
        const fractionPriceEl = priceEl.querySelector('.a-price-fraction');
        
        if (wholePriceEl && fractionPriceEl) {
            // Get the full text content, handling nested elements properly
            const wholeText = wholePriceEl.textContent || wholePriceEl.innerText || '';
            const fractionText = fractionPriceEl.textContent || fractionPriceEl.innerText || '';
            
            // Extract only digits from each part - but handle the decimal point issue
            // The whole part might contain "44." so we need to extract just the number part before the decimal
            let whole = wholeText.replace(/[^\d]/g, '');
            const fraction = fractionText.replace(/[^\d]/g, '');
            
            // Special handling: if wholeText contains digits followed by a decimal, extract just the digits
            const wholeMatch = wholeText.match(/(\d+)/);
            if (wholeMatch) {
                whole = wholeMatch[1];
            }
            
            console.log(`DEBUG: wholeText="${wholeText}", fractionText="${fractionText}", whole="${whole}", fraction="${fraction}"`);
            
            if (whole && fraction) {
                const price = parseFloat(`${whole}.${fraction}`);
                console.log(`Extracted price from parts (whole: "${wholeText}" -> "${whole}", fraction: "${fractionText}" -> "${fraction}"): $${price}`);
                
                // Validate price range
                if (price >= 0.01 && price <= 10000) {
                    return price;
                }
            }
        }
        
        // Alternative: try to get the full price from the visible aria-hidden span
        const visiblePriceSpan = priceEl.querySelector('[aria-hidden="true"]');
        if (visiblePriceSpan) {
            const fullPriceText = visiblePriceSpan.textContent || '';
            console.log(`DEBUG: Found aria-hidden span with text: "${fullPriceText}"`);
            
            // Try to extract price pattern like "$44.08"
            const priceMatch = fullPriceText.match(/\$?(\d+\.?\d*)/);
            if (priceMatch) {
                const price = parseFloat(priceMatch[1]);
                if (price >= 0.01 && price <= 10000) {
                    console.log(`Extracted price from aria-hidden span: $${price}`);
                    return price;
                }
            }
        }
    }
    
    // Last resort: search for any price pattern in the page
    const priceContainers = document.querySelectorAll('[class*="price"], [id*="price"]');
    for (const container of priceContainers) {
        const text = container.textContent;
        const priceMatch = text.match(/\$?([\d,]+\.?\d+)/);
        if (priceMatch) {
            const price = parseFloat(priceMatch[1].replace(/,/g, ''));
            if (price >= 0.01 && price <= 10000) { // Reasonable price range
                console.log(`Found price in container: $${price}`);
                return price;
            }
        }
    }
    
    console.log('No price found');
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