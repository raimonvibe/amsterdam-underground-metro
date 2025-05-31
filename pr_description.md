# Remove mockup data and improve live train display

## Summary
This PR removes all mockup data from the Amsterdam Underground Metro project and improves error handling to ensure live moving metro trains are displayed using real OVAPI data.

## Changes Made

### Backend Changes
- **Removed mock data functions**: Completely removed `_get_mock_metro_lines()`, `_get_mock_stations()`, and `_get_mock_train_positions()` functions from `gtfs_service.py`
- **Improved error handling**: Replaced mock data fallbacks with proper HTTP 503 errors when GTFS data is unavailable
- **Added HTTPException import**: Added missing import for proper error response handling
- **Live train focus**: When OVAPI train data is unavailable, return empty array instead of mock data to ensure only real trains are displayed

### Frontend Changes
- **Enhanced error handling**: Updated API service functions to handle 503 errors gracefully with meaningful error messages
- **Better user feedback**: Improved error messages for when live data sources are temporarily unavailable

### Documentation Changes
- **Updated README**: Removed references to mock data fallback in the data sources section

## Benefits
- **Live data only**: Users now see only real, live metro trains when data is available
- **Clear error states**: When data sources are unavailable, users receive clear feedback instead of being shown fake data
- **Improved reliability**: Better error handling prevents confusion between real and mock data
- **Maintained functionality**: All existing map features (zoom, pan, line visibility) continue to work as expected

## Testing
- Verified live train positions are fetched from OVAPI and displayed on the map
- Confirmed at least one live train is visible when data is available
- Tested error handling when backend services are unavailable
- Ensured existing map functionality remains intact

## Link to Devin run
https://app.devin.ai/sessions/49652cc1393f423db77011d1d4705463

## Requested by
Raimon Baudoin (info@raimonvibe.com)
