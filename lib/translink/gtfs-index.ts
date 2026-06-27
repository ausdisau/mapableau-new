export type GtfsStop = {
  stop_id: string;
  stop_name: string;
  stop_lat: number;
  stop_lon: number;
  wheelchair_boarding?: string;
};

export type GtfsRoute = {
  route_id: string;
  route_short_name: string;
  route_long_name: string;
  route_type: string;
};

export type GtfsTrip = {
  trip_id: string;
  route_id: string;
  trip_headsign?: string;
};

export type GtfsStopTime = {
  trip_id: string;
  stop_id: string;
  arrival_time: string;
  departure_time: string;
  stop_sequence: string;
};

export type GtfsIndex = {
  stops: Map<string, GtfsStop>;
  routes: Map<string, GtfsRoute>;
  trips: Map<string, GtfsTrip>;
  stopTimesByStop: Map<string, GtfsStopTime[]>;
  fetchedAt: number;
};

function parseCsv(content: string): Record<string, string>[] {
  const lines = content.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length < 2) return [];
  const headers = parseCsvLine(lines[0]!);
  return lines.slice(1).map((line) => {
    const values = parseCsvLine(line);
    const row: Record<string, string> = {};
    headers.forEach((h, i) => {
      row[h] = values[i] ?? "";
    });
    return row;
  });
}

function parseCsvLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i]!;
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === "," && !inQuotes) {
      result.push(current);
      current = "";
    } else {
      current += ch;
    }
  }
  result.push(current);
  return result;
}

export function buildGtfsIndex(files: Record<string, string>): GtfsIndex {
  const stops = new Map<string, GtfsStop>();
  for (const row of parseCsv(files.stops ?? "")) {
    if (!row.stop_id) continue;
    stops.set(row.stop_id, {
      stop_id: row.stop_id,
      stop_name: row.stop_name,
      stop_lat: Number(row.stop_lat),
      stop_lon: Number(row.stop_lon),
      wheelchair_boarding: row.wheelchair_boarding,
    });
  }

  const routes = new Map<string, GtfsRoute>();
  for (const row of parseCsv(files.routes ?? "")) {
    if (!row.route_id) continue;
    routes.set(row.route_id, {
      route_id: row.route_id,
      route_short_name: row.route_short_name,
      route_long_name: row.route_long_name,
      route_type: row.route_type,
    });
  }

  const trips = new Map<string, GtfsTrip>();
  for (const row of parseCsv(files.trips ?? "")) {
    if (!row.trip_id) continue;
    trips.set(row.trip_id, {
      trip_id: row.trip_id,
      route_id: row.route_id,
      trip_headsign: row.trip_headsign,
    });
  }

  const stopTimesByStop = new Map<string, GtfsStopTime[]>();
  for (const row of parseCsv(files.stop_times ?? "")) {
    if (!row.stop_id || !row.trip_id) continue;
    const entry: GtfsStopTime = {
      trip_id: row.trip_id,
      stop_id: row.stop_id,
      arrival_time: row.arrival_time,
      departure_time: row.departure_time,
      stop_sequence: row.stop_sequence,
    };
    const list = stopTimesByStop.get(row.stop_id) ?? [];
    list.push(entry);
    stopTimesByStop.set(row.stop_id, list);
  }

  return { stops, routes, trips, stopTimesByStop, fetchedAt: Date.now() };
}

export function haversineMetres(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function searchStopsInIndex(
  index: GtfsIndex,
  query: string,
  maxResults = 10,
  near?: { lat: number; lng: number; radiusMetres?: number }
): GtfsStop[] {
  const q = query.toLowerCase();
  let results = [...index.stops.values()].filter((s) =>
    s.stop_name.toLowerCase().includes(q)
  );

  if (near) {
    const radius = near.radiusMetres ?? 2000;
    results = results.filter(
      (s) =>
        haversineMetres(near.lat, near.lng, s.stop_lat, s.stop_lon) <= radius
    );
    results.sort(
      (a, b) =>
        haversineMetres(near.lat, near.lng, a.stop_lat, a.stop_lon) -
        haversineMetres(near.lat, near.lng, b.stop_lat, b.stop_lon)
    );
  }

  return results.slice(0, maxResults);
}

export function stopsNearCoordInIndex(
  index: GtfsIndex,
  lat: number,
  lng: number,
  radiusMetres = 500,
  maxResults = 10
): Array<GtfsStop & { distanceMetres: number }> {
  return [...index.stops.values()]
    .map((s) => ({
      ...s,
      distanceMetres: haversineMetres(lat, lng, s.stop_lat, s.stop_lon),
    }))
    .filter((s) => s.distanceMetres <= radiusMetres)
    .sort((a, b) => a.distanceMetres - b.distanceMetres)
    .slice(0, maxResults);
}

function timeToMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return (h ?? 0) * 60 + (m ?? 0);
}

function nowMinutesLocal(): number {
  const now = new Date();
  return now.getHours() * 60 + now.getMinutes();
}

export function nextDeparturesFromIndex(
  index: GtfsIndex,
  stopId: string,
  maxResults = 10
): Array<{
  stopId: string;
  tripId: string;
  routeId: string;
  departureTime: string;
  destination?: string;
  routeNumber?: string;
  mode?: string;
}> {
  const stopTimes = index.stopTimesByStop.get(stopId) ?? [];
  const nowMin = nowMinutesLocal();

  const upcoming = stopTimes
    .map((st) => {
      const trip = index.trips.get(st.trip_id);
      const route = trip ? index.routes.get(trip.route_id) : undefined;
      const depMin = timeToMinutes(st.departure_time);
      return {
        stopId,
        tripId: st.trip_id,
        routeId: trip?.route_id ?? "",
        departureTime: st.departure_time,
        depMin,
        destination: trip?.trip_headsign,
        routeNumber: route?.route_short_name,
        mode: route?.route_type,
      };
    })
    .filter((d) => d.depMin >= nowMin - 2)
    .sort((a, b) => a.depMin - b.depMin)
    .slice(0, maxResults);

  return upcoming.map(({ depMin: _depMin, ...rest }) => rest);
}
