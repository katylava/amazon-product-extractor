**Create a Chrome extension that extracts Amazon product information and copies it as rich text with tabs for spreadsheet compatibility.**

**Requirements:**

1. **Functionality**: When clicked on an Amazon product page, extract product name, price, weight, and calculate price per unit weight
2. **Interface**: Display results in a popup with rich formatting - product name as clickable link, other data as labeled fields
3. **Copy Feature**: Include a clipboard icon that copies rich text HTML with tab characters between values for spreadsheet pasting
4. **Calculation**: Price per weight should always show 2 decimal places and handle multiple weight units (lb, oz, kg, g)

**Technical Specs:**
- Manifest v3 Chrome extension
- Permissions: activeTab, clipboardWrite
- Content script for Amazon.com pages
- Popup interface (450px wide)
- Smart selectors for Amazon's varying HTML structure
- Error handling for missing data

**Files needed:**
1. manifest.json - Extension configuration
2. popup.html - UI with extract button, results display, and copy button with clipboard icon
3. popup.js - Popup logic, extraction triggering, rich text copying with tabs
4. content.js - Amazon page scraping, price/weight parsing, unit conversion, calculation
5. background.js - Service worker (minimal)

**Copy behavior**: When copy button clicked, create rich text HTML with product name as hyperlink followed by tab characters then price, weight, and price per weight - designed to paste into spreadsheet as separate columns while preserving the clickable product link.