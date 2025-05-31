import { useState } from 'react';
import { MetroLine, Station, TrainPosition } from '../types';
import { Clock, Info, RefreshCw } from 'lucide-react';

interface SidebarProps {
  metroLines: MetroLine[];
  visibleLines: string[];
  onToggleLine: (lineId: string) => void;
  onRefresh: () => void;
  lastUpdated: Date | null;
  selectedStation: Station | null;
  hoveredTrain: TrainPosition | null;
  trainPositions: TrainPosition[];
}

const Sidebar = ({
  metroLines,
  visibleLines,
  onToggleLine,
  onRefresh,
  lastUpdated,
  selectedStation,
  hoveredTrain,
  trainPositions,
}: SidebarProps) => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <div
      className={`bg-gray-900 text-white p-4 rounded-lg shadow-lg transition-all duration-300 ${
        isCollapsed ? 'w-16' : 'w-80'
      }`}
    >
      <div className="flex justify-between items-center mb-4">
        <h2 className={`text-xl font-bold ${isCollapsed ? 'hidden' : 'block'}`}>
          Amsterdam Metro
        </h2>
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-2 rounded-full hover:bg-gray-700"
        >
          {isCollapsed ? (
            <Info size={20} />
          ) : (
            <Info size={20} />
          )}
        </button>
      </div>

      {!isCollapsed && (
        <>
          <div className="mb-6">
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-lg font-semibold">Metro Lines</h3>
              <button
                onClick={onRefresh}
                className="p-2 rounded-full hover:bg-gray-700 text-gray-300"
                title="Refresh data"
              >
                <RefreshCw size={16} />
              </button>
            </div>
            <div className="space-y-2">
              {metroLines.map((line) => {
                const lineTrainCount = trainPositions.filter(train => train.route_id === line.id).length;
                return (
                  <div
                    key={line.id}
                    className="flex items-center justify-between space-x-2"
                  >
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id={`line-${line.id}`}
                        checked={visibleLines.includes(line.id)}
                        onChange={() => onToggleLine(line.id)}
                        className="rounded text-blue-500 focus:ring-blue-500"
                      />
                      <label
                        htmlFor={`line-${line.id}`}
                        className="flex items-center cursor-pointer"
                      >
                        <span
                          className="w-4 h-4 rounded-full mr-2"
                          style={{ backgroundColor: `#${line.color}` }}
                        ></span>
                        <span>Line {line.name}</span>
                      </label>
                    </div>
                    <span className="text-xs text-gray-400 bg-gray-800 px-2 py-1 rounded">
                      {lineTrainCount} trains
                    </span>
                  </div>
                );
              })}
            </div>
            <div className="mt-3 pt-3 border-t border-gray-700">
              <div className="text-sm text-gray-400">
                Total active trains: <span className="text-white font-semibold">{trainPositions.length}</span>
              </div>
            </div>
          </div>

          {lastUpdated && (
            <div className="text-sm text-gray-400 flex items-center mb-4">
              <Clock size={14} className="mr-1" />
              <span>
                Last updated: {lastUpdated.toLocaleTimeString()}
              </span>
            </div>
          )}

          {selectedStation && (
            <div className="mb-4 p-3 bg-gray-800 rounded-lg">
              <h3 className="text-lg font-semibold mb-1">{selectedStation.name}</h3>
              <p className="text-sm text-gray-300">
                Lines: {selectedStation.routes.map((routeId) => {
                  const line = metroLines.find((l) => l.id === routeId);
                  return line ? line.name : routeId;
                }).join(', ')}
              </p>
            </div>
          )}

          {hoveredTrain && (
            <div className="p-3 bg-gray-800 rounded-lg">
              <h3 className="text-lg font-semibold mb-1">
                Train {hoveredTrain.vehicle_id}
              </h3>
              <div className="text-sm text-gray-300 space-y-1">
                <p>Line: {hoveredTrain.route_id}</p>
                {hoveredTrain.speed && (
                  <p>Speed: {Math.round(hoveredTrain.speed)} km/h</p>
                )}
                {hoveredTrain.status && (
                  <p>Status: {hoveredTrain.status.replace(/_/g, ' ')}</p>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Sidebar;
