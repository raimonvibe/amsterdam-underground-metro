import { useEffect, useState } from 'react';
import Map from './components/Map';
import Sidebar from './components/Sidebar';
import { MetroLine, Station, TrainPosition } from './types';
import { fetchMetroLines, fetchStations, fetchTrainPositions } from './services/api';

function App() {
  const [metroLines, setMetroLines] = useState<MetroLine[]>([]);
  const [stations, setStations] = useState<Station[]>([]);
  const [trainPositions, setTrainPositions] = useState<TrainPosition[]>([]);
  const [visibleLines, setVisibleLines] = useState<string[]>([]);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [selectedStation, setSelectedStation] = useState<Station | null>(null);
  const [hoveredTrain, setHoveredTrain] = useState<TrainPosition | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const lines = await fetchMetroLines();
        setMetroLines(lines);
        
        setVisibleLines(lines.map(line => line.id));

        const stationData = await fetchStations();
        setStations(stationData);

        setIsLoading(false);
        setLastUpdated(new Date());
      } catch (err) {
        setError('Failed to load metro data. Please try again later.');
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    const fetchPositions = async () => {
      try {
        const positions = await fetchTrainPositions();
        setTrainPositions(positions);
        setLastUpdated(new Date());
      } catch (err) {
        console.error('Error fetching train positions:', err);
      }
    };

    fetchPositions();

    const intervalId = setInterval(fetchPositions, 3000);

    return () => clearInterval(intervalId);
  }, []);

  const handleToggleLine = (lineId: string) => {
    setVisibleLines(prev => 
      prev.includes(lineId)
        ? prev.filter(id => id !== lineId)
        : [...prev, lineId]
    );
  };

  const handleRefresh = async () => {
    try {
      setIsLoading(true);
      
      const [lines, stationData, positions] = await Promise.all([
        fetchMetroLines(),
        fetchStations(),
        fetchTrainPositions()
      ]);
      
      setMetroLines(lines);
      setStations(stationData);
      setTrainPositions(positions);
      setLastUpdated(new Date());
      setIsLoading(false);
    } catch (err) {
      setError('Failed to refresh data. Please try again later.');
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gray-950 text-white p-4">
      <header className="mb-4">
        <h1 className="text-2xl font-bold">Amsterdam Metro Tracker</h1>
      </header>
      
      {error && (
        <div className="bg-red-900 text-white p-4 rounded-lg mb-4">
          {error}
        </div>
      )}
      
      <main className="flex flex-1 gap-4 overflow-hidden">
        <Sidebar
          metroLines={metroLines}
          visibleLines={visibleLines}
          onToggleLine={handleToggleLine}
          onRefresh={handleRefresh}
          lastUpdated={lastUpdated}
          selectedStation={selectedStation}
          hoveredTrain={hoveredTrain}
          trainPositions={trainPositions}
        />
        
        <div className="flex-1 relative rounded-lg overflow-hidden">
          {isLoading ? (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white"></div>
            </div>
          ) : (
            <Map
              metroLines={metroLines}
              stations={stations}
              trainPositions={trainPositions}
              visibleLines={visibleLines}
              onStationClick={setSelectedStation}
              onTrainHover={setHoveredTrain}
            />
          )}
        </div>
      </main>
      
      <footer className="mt-4 text-center text-gray-500 text-sm">
        Amsterdam Metro Tracker &copy; {new Date().getFullYear()}
      </footer>
    </div>
  );
}

export default App;
