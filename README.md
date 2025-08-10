# Amazon Product Extractor

A Chrome extension that extracts Amazon product information and copies it as rich text with tabs for spreadsheet compatibility.

## Features

- **Product Information Extraction**: Automatically extracts product name, price, and weight from Amazon product pages
- **Price Per Weight Calculation**: Calculates price per unit weight with 2 decimal places
- **Multi-Unit Support**: Handles pounds, ounces, kilograms, and grams with automatic conversion
- **Rich Text Copying**: Copies data with tab separators for easy spreadsheet pasting
- **Clickable Links**: Product names remain as clickable hyperlinks when pasted
- **Smart Selectors**: Works across Amazon's varying HTML structures
- **Error Handling**: Graceful handling of missing data or invalid pages

## Installation

1. Download or clone this repository
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode" in the top right corner
4. Click "Load unpacked" and select the extension directory
5. The Amazon Product Extractor icon will appear in your Chrome toolbar

## Usage

1. Navigate to any Amazon product page
2. Click the Amazon Product Extractor icon in your toolbar
3. Click "Extract Product Info" in the popup
4. Review the extracted information
5. Click "Copy for Spreadsheet" to copy the data with tab separators
6. Paste into your spreadsheet - data will appear in separate columns with clickable product links

## Supported Amazon Domains

- amazon.com
- amazon.co.uk
- amazon.ca
- amazon.de
- amazon.fr
- amazon.it
- amazon.es

## Data Format

When copied, the data is formatted as:
```
[Product Name as Hyperlink]	[Price]	[Weight]	[Price per Weight]
```

Example output in spreadsheet:
| Product Name (Clickable) | Price | Weight | Price/Weight |
|-------------------------|-------|---------|--------------|
| Example Product | $12.99 | 2.5 lb | $5.20/lb |

## Technical Details

- **Manifest Version**: 3
- **Permissions**: `activeTab`, `clipboardWrite`
- **Popup Width**: 450px
- **Weight Units Supported**: lb, oz, kg, g
- **Price Calculation**: Always displays 2 decimal places

## Files Structure

```
amazon-product-extractor/
├── manifest.json       # Extension configuration
├── popup.html         # User interface
├── popup.js          # Popup logic and clipboard functionality
├── content.js        # Amazon page scraping and calculations
├── background.js     # Service worker
└── README.md         # This file
```

## Troubleshooting

**Extension doesn't work on a page:**
- Ensure you're on a valid Amazon product page
- Try refreshing the page and clicking extract again
- Check that the extension has proper permissions

**Missing product information:**
- Some Amazon pages may have different layouts
- Weight information is not always available on all products
- Price calculation requires both price and weight to be found

**Copy functionality not working:**
- Ensure your browser allows clipboard access
- Try refreshing the extension popup
- Check browser permissions for the extension

## Development

To modify the extension:

1. Make changes to the relevant files
2. Go to `chrome://extensions/`
3. Click the refresh icon on the Amazon Product Extractor card
4. Test your changes on Amazon product pages

## Privacy

This extension:
- Only accesses Amazon product pages when activated
- Does not collect or store any personal data
- Does not send data to external servers
- Only requests necessary permissions (`activeTab`, `clipboardWrite`)

## License

This project is open source and available under the MIT License.