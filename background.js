chrome.runtime.onInstalled.addListener(() => {
    console.log('Amazon Product Extractor extension installed');
});

chrome.action.onClicked.addListener((tab) => {
    if (tab.url.includes('amazon.')) {
        chrome.action.openPopup();
    } else {
        chrome.tabs.create({
            url: 'https://amazon.com'
        });
    }
});