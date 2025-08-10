document.addEventListener('DOMContentLoaded', function() {
    const extractBtn = document.getElementById('extractBtn');
    const loadingDiv = document.getElementById('loading');
    const resultsDiv = document.getElementById('results');
    const errorDiv = document.getElementById('error');
    const copyBtn = document.getElementById('copyBtn');
    
    let currentProductData = null;
    
    extractBtn.addEventListener('click', extractProductInfo);
    copyBtn.addEventListener('click', copyToClipboard);
    
    async function extractProductInfo() {
        try {
            extractBtn.disabled = true;
            loadingDiv.style.display = 'block';
            resultsDiv.style.display = 'none';
            errorDiv.style.display = 'none';
            
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            
            if (!tab.url.includes('amazon.')) {
                throw new Error('Please navigate to an Amazon product page first.');
            }
            
            // Try to inject content script if it's not already there
            try {
                await chrome.scripting.executeScript({
                    target: { tabId: tab.id },
                    files: ['content.js']
                });
            } catch (injectionError) {
                // Content script might already be injected, continue
                console.log('Content script injection attempt:', injectionError.message);
            }
            
            // Add retry logic with timeout
            let response = null;
            let attempts = 0;
            const maxAttempts = 3;
            
            while (attempts < maxAttempts && !response) {
                try {
                    response = await chrome.tabs.sendMessage(tab.id, { action: 'extractProduct' });
                    break;
                } catch (messageError) {
                    attempts++;
                    console.log(`Message attempt ${attempts} failed:`, messageError.message);
                    
                    if (attempts < maxAttempts) {
                        // Wait a bit before retrying
                        await new Promise(resolve => setTimeout(resolve, 500));
                    } else {
                        throw new Error('Failed to communicate with the page. Please refresh the page and try again.');
                    }
                }
            }
            
            if (!response) {
                throw new Error('Failed to extract product information. Make sure you are on a valid Amazon product page.');
            }
            
            currentProductData = response;
            displayResults(response);
            
        } catch (error) {
            console.error('Error:', error);
            showError(error.message || 'An error occurred while extracting product information.');
        } finally {
            extractBtn.disabled = false;
            loadingDiv.style.display = 'none';
        }
    }
    
    function displayResults(data) {
        const productNameEl = document.getElementById('productName');
        const priceEl = document.getElementById('price');
        const weightEl = document.getElementById('weight');
        const pricePerWeightEl = document.getElementById('pricePerWeight');
        
        if (data.name) {
            productNameEl.textContent = data.name;
            productNameEl.href = data.url;
        } else {
            productNameEl.textContent = 'Product name not found';
            productNameEl.href = data.url;
        }
        
        priceEl.textContent = data.price ? `$${data.price.toFixed(2)}` : 'Price not found';
        
        if (data.weight) {
            weightEl.textContent = `${data.weight.value} ${data.weight.unit}`;
        } else {
            weightEl.textContent = 'Weight not found';
        }
        
        if (data.pricePerWeight) {
            pricePerWeightEl.textContent = data.pricePerWeight.display;
        } else {
            pricePerWeightEl.textContent = 'Cannot calculate (missing price or weight)';
        }
        
        resultsDiv.style.display = 'block';
    }
    
    function showError(message) {
        errorDiv.textContent = message;
        errorDiv.style.display = 'block';
        resultsDiv.style.display = 'none';
    }
    
    async function copyToClipboard() {
        if (!currentProductData) {
            showError('No product data to copy. Please extract product information first.');
            return;
        }
        
        try {
            const richTextHTML = createRichTextHTML(currentProductData);
            
            const clipboardItem = new ClipboardItem({
                'text/html': new Blob([richTextHTML], { type: 'text/html' }),
                'text/plain': new Blob([createPlainText(currentProductData)], { type: 'text/plain' })
            });
            
            await navigator.clipboard.write([clipboardItem]);
            
            const originalText = copyBtn.innerHTML;
            copyBtn.innerHTML = '<span class="copy-icon">✓</span>Copied!';
            copyBtn.style.backgroundColor = '#28a745';
            
            setTimeout(() => {
                copyBtn.innerHTML = originalText;
                copyBtn.style.backgroundColor = '#232F3E';
            }, 2000);
            
        } catch (error) {
            console.error('Copy error:', error);
            
            try {
                await navigator.clipboard.writeText(createPlainText(currentProductData));
                
                const originalText = copyBtn.innerHTML;
                copyBtn.innerHTML = '<span class="copy-icon">✓</span>Copied (text only)!';
                copyBtn.style.backgroundColor = '#28a745';
                
                setTimeout(() => {
                    copyBtn.innerHTML = originalText;
                    copyBtn.style.backgroundColor = '#232F3E';
                }, 2000);
                
            } catch (fallbackError) {
                console.error('Fallback copy error:', fallbackError);
                showError('Failed to copy to clipboard. Please check your browser permissions.');
            }
        }
    }
    
    function createRichTextHTML(data) {
        const productName = data.name || 'Product name not found';
        const price = data.price ? `$${data.price.toFixed(2)}` : 'Price not found';
        const weight = data.weight ? `${data.weight.value} ${data.weight.unit}` : 'Weight not found';
        const pricePerWeight = data.pricePerWeight ? data.pricePerWeight.display : 'Cannot calculate';
        
        const html = `<a href="${data.url}" target="_blank">${productName}</a>\t${price}\t${weight}\t${pricePerWeight}`;
        
        return html;
    }
    
    function createPlainText(data) {
        const productName = data.name || 'Product name not found';
        const price = data.price ? `$${data.price.toFixed(2)}` : 'Price not found';
        const weight = data.weight ? `${data.weight.value} ${data.weight.unit}` : 'Weight not found';
        const pricePerWeight = data.pricePerWeight ? data.pricePerWeight.display : 'Cannot calculate';
        const url = data.url;
        
        return `${productName} (${url})\t${price}\t${weight}\t${pricePerWeight}`;
    }
});