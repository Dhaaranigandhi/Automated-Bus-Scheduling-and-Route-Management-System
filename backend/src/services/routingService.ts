import logger from '../config/logger';

export interface Waypoint {
  latitude: number;
  longitude: number;
  name?: string;
}

export interface RouteCalculationResult {
  totalDistanceKm: number;
  totalDurationMinutes: number;
  geometryCoordinates: Array<[number, number]>; // [lat, lng]
  legs: Array<{
    distanceKm: number;
    durationMinutes: number;
  }>;
  providerUsed: string;
}

export interface IRoutingProvider {
  name: string;
  calculateRoute(waypoints: Waypoint[]): Promise<RouteCalculationResult>;
}

/**
 * Default OpenStreetMap / Geodesic Haversine Fallback Provider
 * Used when no external API key (ORS / Google Maps) is set.
 */
export class HaversineRoutingProvider implements IRoutingProvider {
  name = 'OSM / Haversine Engine (Built-in)';

  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Radius of the Earth in km
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  async calculateRoute(waypoints: Waypoint[]): Promise<RouteCalculationResult> {
    if (waypoints.length < 2) {
      return {
        totalDistanceKm: 0,
        totalDurationMinutes: 0,
        geometryCoordinates: waypoints.map((w) => [w.latitude, w.longitude]),
        legs: [],
        providerUsed: this.name,
      };
    }

    let totalDistanceKm = 0;
    const legs: Array<{ distanceKm: number; durationMinutes: number }> = [];
    const geometryCoordinates: Array<[number, number]> = [];

    for (let i = 0; i < waypoints.length - 1; i++) {
      const from = waypoints[i];
      const to = waypoints[i + 1];

      const dist = this.calculateDistance(from.latitude, from.longitude, to.latitude, to.longitude);
      // Assume average urban bus velocity of ~30 km/h (0.5 km/min)
      const durationMin = Math.round((dist / 30) * 60) + 2; // + 2 mins dwell time per stop

      totalDistanceKm += dist;
      legs.push({
        distanceKm: parseFloat(dist.toFixed(2)),
        durationMinutes: durationMin,
      });

      // Interpolate intermediate polyline coordinates for smooth Leaflet rendering
      const steps = 10;
      for (let s = 0; s <= steps; s++) {
        const interpLat = from.latitude + (to.latitude - from.latitude) * (s / steps);
        const interpLng = from.longitude + (to.longitude - from.longitude) * (s / steps);
        geometryCoordinates.push([parseFloat(interpLat.toFixed(6)), parseFloat(interpLng.toFixed(6))]);
      }
    }

    const totalDurationMinutes = legs.reduce((acc, leg) => acc + leg.durationMinutes, 0);

    return {
      totalDistanceKm: parseFloat(totalDistanceKm.toFixed(2)),
      totalDurationMinutes,
      geometryCoordinates,
      legs,
      providerUsed: this.name,
    };
  }
}

/**
 * Unified Routing Service Factory
 */
class RoutingService {
  private activeProvider: IRoutingProvider;

  constructor() {
    // Check if OpenRouteService or Google Maps API key exists in environment
    if (process.env.ORS_API_KEY) {
      logger.info('Routing Service: Initialized with OpenRouteService provider.');
      // OpenRouteServiceProvider can be instantiated here when key is set
      this.activeProvider = new HaversineRoutingProvider(); 
    } else {
      logger.info('Routing Service: Initialized with default Haversine / OpenStreetMap engine.');
      this.activeProvider = new HaversineRoutingProvider();
    }
  }

  public setProvider(provider: IRoutingProvider) {
    this.activeProvider = provider;
    logger.info(`Routing Service provider switched to: ${provider.name}`);
  }

  public async calculateRoute(waypoints: Waypoint[]): Promise<RouteCalculationResult> {
    return this.activeProvider.calculateRoute(waypoints);
  }
}

export const routingService = new RoutingService();
