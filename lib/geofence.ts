import { Branch, GeofenceResult } from "@/types";

/**
 * Radius of the Earth in meters
 */
const EARTH_RADIUS_METERS = 6371000;

/**
 * Convert degrees to radians
 */
function toRadians(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

/**
 * Calculate the great-circle distance between two points on the Earth
 * using the Haversine formula.
 *
 * dLat = toRad(lat2 - lat1)
 * dLon = toRad(lon2 - lon1)
 * a = sin²(dLat/2) + cos(lat1) * cos(lat2) * sin²(dLon/2)
 * c = 2 * atan2(√a, √(1−a))
 * d = R * c
 *
 * @returns distance in meters rounded to nearest integer
 */
export function calculateHaversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);

  const radLat1 = toRadians(lat1);
  const radLat2 = toRadians(lat2);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(radLat1) * Math.cos(radLat2) * Math.sin(dLon / 2) * Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return Math.round(EARTH_RADIUS_METERS * c);
}

export const calculateDistanceMeters = calculateHaversineDistance;

/**
 * Generate a standard Google Maps URL pointing to the given coordinates
 */
export function generateGoogleMapsUrl(lat: number, lng: number): string {
  return `https://maps.google.com/?q=${lat.toFixed(6)},${lng.toFixed(6)}`;
}

export const MAX_GEOFENCE_RADIUS_METERS = 100;

/**
 * Validate whether user coordinates fall within the branch's geofence radius.
 * STRICT ENFORCEMENT: Any distance greater than 100 meters (> 100m) is strictly OUT OF GEOFENCE and scanning is blocked.
 */
export function validateBranchGeofence(
  userLat: number,
  userLng: number,
  branch: Branch
): GeofenceResult {
  const distanceMeters = calculateHaversineDistance(
    userLat,
    userLng,
    branch.latitude,
    branch.longitude
  );

  const radiusMeters = Math.min(branch.radiusMeters || MAX_GEOFENCE_RADIUS_METERS, MAX_GEOFENCE_RADIUS_METERS);
  const isWithinGeofence = distanceMeters <= radiusMeters;

  return {
    isWithinGeofence,
    distanceMeters,
    branchRadiusMeters: radiusMeters,
    statusLabelKhmer: isWithinGeofence
      ? `✅ ក្នុងបរិវេណ (${distanceMeters}m ≤ ${radiusMeters}m)`
      : `⛔ ក្រៅបរិវេណ (${distanceMeters}m > ${radiusMeters}m)`,
    googleMapsUrl: generateGoogleMapsUrl(userLat, userLng),
  };
}
