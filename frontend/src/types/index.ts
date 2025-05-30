export interface Station {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  routes: string[];
}

export interface MetroLine {
  id: string;
  name: string;
  color: string;
  route_id: string;
  shape: [number, number][]; // [longitude, latitude] coordinates
  stations: Station[];
}

export interface TrainPosition {
  id: string;
  route_id: string;
  latitude: number;
  longitude: number;
  bearing?: number;
  speed?: number;
  status?: string;
  timestamp: number;
  vehicle_id: string;
  trip_id?: string;
}
