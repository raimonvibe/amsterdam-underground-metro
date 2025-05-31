import { MetroLine, Station, TrainPosition } from '../types';

const API_BASE = '/api';

export const fetchMetroLines = async (): Promise<MetroLine[]> => {
  try {
    const response = await fetch(`${API_BASE}/metro-lines`);
    if (!response.ok) {
      if (response.status === 503) {
        throw new Error('Metro lines data temporarily unavailable');
      }
      throw new Error(`Error fetching metro lines: ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Failed to fetch metro lines:', error);
    return [];
  }
};

export const fetchStations = async (): Promise<Station[]> => {
  try {
    const response = await fetch(`${API_BASE}/stations`);
    if (!response.ok) {
      if (response.status === 503) {
        throw new Error('Stations data temporarily unavailable');
      }
      throw new Error(`Error fetching stations: ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Failed to fetch stations:', error);
    return [];
  }
};

export const fetchTrainPositions = async (): Promise<TrainPosition[]> => {
  try {
    const response = await fetch(`${API_BASE}/train-positions`);
    if (!response.ok) {
      if (response.status === 503) {
        throw new Error('Live train data temporarily unavailable');
      }
      throw new Error(`Error fetching train positions: ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Failed to fetch train positions:', error);
    return [];
  }
};

export const fetchMapboxToken = async (): Promise<string | null> => {
  try {
    const response = await fetch(`${API_BASE}/config/mapbox-token`);
    if (!response.ok) {
      console.warn('No custom Mapbox token configured, using default');
      return null;
    }
    const data = await response.json();
    return data.token;
  } catch (error) {
    console.error('Failed to fetch Mapbox token:', error);
    return null;
  }
};

export const setMapboxToken = async (token: string): Promise<boolean> => {
  try {
    const response = await fetch(`${API_BASE}/config/mapbox-token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ token }),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      console.error('Failed to set Mapbox token:', errorData.detail || response.statusText);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Failed to set Mapbox token:', error);
    return false;
  }
};
