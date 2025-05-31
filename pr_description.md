# Fix Map Visibility Issue - Resolve Excessive Re-rendering

## Problem
The Amsterdam Metro Tracker map was only visible for short timespans due to excessive component re-rendering (76+ renders) caused by:
- Unstable useEffect dependencies causing map reinitialization loops
- Mapbox token loading issues with 403 authentication errors
- Missing environment variable fallback for Mapbox token

## Solution
1. **Fixed useEffect Dependencies**: Removed `mapboxToken` from map initialization dependencies to prevent re-rendering loops
2. **Added Map Instance Guard**: Added `map.current` check to prevent multiple map initializations
3. **Improved Token Loading**: Added fallback to `VITE_MAPBOX_TOKEN` environment variable when backend token fetch fails
4. **Enhanced Cleanup**: Properly nullify map reference on component unmount

## Changes Made
- Modified `frontend/src/components/Map.tsx`:
  - Updated map initialization useEffect to only depend on `isTokenLoaded`
  - Added guard to prevent duplicate map instances
  - Enhanced token loading with environment variable fallback
  - Improved cleanup in component unmount

## Testing Results
✅ Map now renders consistently and remains visible
✅ Reduced component re-renders from 76+ to 6 initial renders
✅ All 90 train markers display correctly across metro lines 50-54
✅ Real-time updates continue working every 3 seconds
✅ Map controls and interactions function properly

## Screenshots
![Map Working](screenshots/localhost_5173_065706.png)

**Link to Devin run**: https://app.devin.ai/sessions/a46b9e270eea4f22a36c9818a98fe29f
**Requested by**: Raimon Baudoin (info@raimonvibe.com)
