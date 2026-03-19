

# Add Logo Upload to Add Account Dialog

## What changes

### 1. `src/components/account/AddAccountDialog.tsx`
- Add a separate file input for PNG/SVG logo upload (before or alongside the JSON upload)
- Convert the uploaded image to a base64 data URL and store it in state
- Show a preview of the uploaded logo with transparent background
- Pass the logo data URL to `addAccount()` via the `logo` field in the JSON data

### 2. `src/components/layout/AppSidebar.tsx`
- Import `useAccount` context
- Replace all hardcoded `cornerstoneLogo` references with `activeAccount?.logo || cornerstoneLogo`
- Also update the brand name text to use `activeAccount?.name || "cornerstone"` (optional but consistent)

### 3. Logo handling details
- Accept `.png` and `.svg` files only
- Convert to base64 data URL using `FileReader.readAsDataURL()`
- For SVG files, also read as text to verify it's valid SVG
- The logo is stored in the `accounts.logo` column (already exists as text/nullable)
- Data URLs naturally preserve transparency — no special handling needed
- Logo preview in the dialog will use a checkered background pattern to show transparency

### Flow
1. User opens Add Account dialog
2. Uploads JSON file (existing behavior)
3. Optionally uploads a logo (PNG/SVG) — separate drop zone or button
4. On submit, logo data URL is included in the `addAccount()` call
5. Sidebar reads `activeAccount.logo` and displays it instead of the default Cornerstone logo

