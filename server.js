const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*' }
});

// Serve static files from the public directory
app.use(express.static(path.join(__dirname, 'public')));

// Explicit routes for User Mode (/) and Admin Panel (/admin)
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get(['/admin', '/admin/*'], (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Bangladesh Standard Time (Asia/Dhaka) helper
function getBDTime() {
  return new Date().toLocaleTimeString('en-US', {
    timeZone: 'Asia/Dhaka',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true
  });
}

// Haversine formula to calculate distance between two coordinates in meters strictly parsing numbers
function getDistanceMeters(lat1, lon1, lat2, lon2) {
  const pLat1 = parseFloat(lat1);
  const pLon1 = parseFloat(lon1);
  const pLat2 = parseFloat(lat2);
  const pLon2 = parseFloat(lon2);
  if (isNaN(pLat1) || isNaN(pLon1) || isNaN(pLat2) || isNaN(pLon2)) return 0;

  const R = 6371e3; // Earth radius in meters
  const toRad = (deg) => (deg * Math.PI) / 180;
  const dLat = toRad(pLat2 - pLat1);
  const dLon = toRad(pLon2 - pLon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(pLat1)) * Math.cos(toRad(pLat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// ═════════════════════════════════════════════════════════════════
// 🚓 Comprehensive Built-in Bangladesh Police Stations Dataset
// ═════════════════════════════════════════════════════════════════
const FALLBACK_POLICE_STATIONS = [
  // --- Dhaka Metropolitan & Greater Dhaka ---
  { name: 'Dhanmondi Police Station', lat: 23.7465, lng: 90.3760, phone: '01713-373126' },
  { name: 'Kalabagan Police Station', lat: 23.7480, lng: 90.3820, phone: '01713-373129' },
  { name: 'Ramna Model Thana', lat: 23.7410, lng: 90.4005, phone: '01713-373125' },
  { name: 'Shahbagh Police Station', lat: 23.7380, lng: 90.3955, phone: '01713-373127' },
  { name: 'New Market Police Station', lat: 23.7335, lng: 90.3845, phone: '01713-373128' },
  { name: 'Mohammadpur Police Station', lat: 23.7580, lng: 90.3620, phone: '01713-373130' },
  { name: 'Adabor Police Station', lat: 23.7730, lng: 90.3580, phone: '01713-373131' },
  { name: 'Tejgaon Police Station', lat: 23.7595, lng: 90.3910, phone: '01713-373135' },
  { name: 'Tejgaon Industrial Thana', lat: 23.7710, lng: 90.4020, phone: '01713-373136' },
  { name: 'Hatirjheel Police Station', lat: 23.7660, lng: 90.4090, phone: '01713-373137' },
  { name: 'Mirpur Model Thana', lat: 23.8070, lng: 90.3685, phone: '01713-373145' },
  { name: 'Pallabi Police Station', lat: 23.8240, lng: 90.3640, phone: '01713-373146' },
  { name: 'Kafrul Police Station', lat: 23.7910, lng: 90.3830, phone: '01713-373147' },
  { name: 'Darus Salam Police Station', lat: 23.7915, lng: 90.3540, phone: '01713-373148' },
  { name: 'Gulshan Police Station', lat: 23.7925, lng: 90.4150, phone: '01713-373155' },
  { name: 'Banani Police Station', lat: 23.7937, lng: 90.4042, phone: '01713-373156' },
  { name: 'Badda Police Station', lat: 23.7820, lng: 90.4260, phone: '01713-373160' },
  { name: 'Bhatara Police Station', lat: 23.8110, lng: 90.4280, phone: '01713-373161' },
  { name: 'Khilkhet Police Station', lat: 23.8310, lng: 90.4180, phone: '01713-373162' },
  { name: 'Cantonment Police Station', lat: 23.8230, lng: 90.3950, phone: '01713-373150' },
  { name: 'Airport Police Station', lat: 23.8510, lng: 90.4080, phone: '01713-373151' },
  { name: 'Uttara East Thana', lat: 23.8680, lng: 90.4020, phone: '01713-373157' },
  { name: 'Uttara West Thana', lat: 23.8720, lng: 90.3880, phone: '01713-373158' },
  { name: 'Turag Police Station', lat: 23.8820, lng: 90.3720, phone: '01713-373152' },
  { name: 'Dakshinkhan Police Station', lat: 23.8640, lng: 90.4270, phone: '01713-373153' },
  { name: 'Motijheel Police Station', lat: 23.7330, lng: 90.4180, phone: '01713-373170' },
  { name: 'Paltan Model Thana', lat: 23.7360, lng: 90.4120, phone: '01713-373171' },
  { name: 'Khilgaon Police Station', lat: 23.7510, lng: 90.4280, phone: '01713-373172' },
  { name: 'Sabujbagh Police Station', lat: 23.7420, lng: 90.4320, phone: '01713-373173' },
  { name: 'Mugda Police Station', lat: 23.7310, lng: 90.4340, phone: '01713-373174' },
  { name: 'Lalbagh Police Station', lat: 23.7190, lng: 90.3880, phone: '01713-373180' },
  { name: 'Kotwali Thana, Dhaka', lat: 23.7090, lng: 90.4060, phone: '01713-373181' },
  { name: 'Chawkbazar Police Station', lat: 23.7170, lng: 90.3960, phone: '01713-373182' },
  { name: 'Hazaribagh Police Station', lat: 23.7380, lng: 90.3670, phone: '01713-373183' },
  { name: 'Kamrangirchar Police Station', lat: 23.7140, lng: 90.3750, phone: '01713-373184' },
  { name: 'Wari Police Station', lat: 23.7180, lng: 90.4180, phone: '01713-373185' },
  { name: 'Gendaria Police Station', lat: 23.7080, lng: 90.4260, phone: '01713-373186' },
  { name: 'Jatrabari Police Station', lat: 23.7090, lng: 90.4370, phone: '01713-373190' },
  { name: 'Kadamtali Police Station', lat: 23.6980, lng: 90.4480, phone: '01713-373191' },
  { name: 'Demra Police Station', lat: 23.7180, lng: 90.4890, phone: '01713-373192' },
  { name: 'Shyampur Police Station', lat: 23.6920, lng: 90.4380, phone: '01713-373193' },
  { name: 'Savar Model Thana', lat: 23.8480, lng: 90.2580, phone: '01713-373200' },
  { name: 'Ashulia Police Station', lat: 23.9010, lng: 90.3120, phone: '01713-373201' },
  { name: 'Tongi East Thana', lat: 23.8960, lng: 90.4070, phone: '01713-373251' },
  { name: 'Gazipur Sadar Thana', lat: 23.9980, lng: 90.4230, phone: '01713-373250' },

  // --- Narail & Khulna Division ---
  { name: 'Narail Sadar Thana', lat: 23.1785, lng: 89.5020, phone: '01713-374150' },
  { name: 'Lohagara Thana, Narail', lat: 23.1890, lng: 89.6540, phone: '01713-374151' },
  { name: 'Kalia Thana, Narail', lat: 23.0420, lng: 89.6380, phone: '01713-374152' },
  { name: 'Naragati Thana, Narail', lat: 22.9560, lng: 89.7120, phone: '01713-374153' },
  { name: 'Kotwali Model Thana, Jashore', lat: 23.1670, lng: 89.2085, phone: '01713-374120' },
  { name: 'Jhikargachha Thana', lat: 23.1020, lng: 89.1320, phone: '01713-374121' },
  { name: 'Benapole Port Thana', lat: 23.0380, lng: 88.8970, phone: '01713-374122' },
  { name: 'Khulna Sadar Thana', lat: 22.8120, lng: 89.5640, phone: '01713-374100' },
  { name: 'Sonadanga Model Thana', lat: 22.8250, lng: 89.5480, phone: '01713-374101' },
  { name: 'Khalishpur Thana', lat: 22.8520, lng: 89.5370, phone: '01713-374102' },
  { name: 'Daulatpur Thana, Khulna', lat: 22.8840, lng: 89.5160, phone: '01713-374103' },

  // --- Chattogram Division ---
  { name: 'Kotwali Thana, Chattogram', lat: 22.3380, lng: 91.8340, phone: '01713-373300' },
  { name: 'Panchlaish Thana', lat: 22.3660, lng: 91.8260, phone: '01713-373301' },
  { name: 'Double Mooring Thana', lat: 22.3360, lng: 91.8080, phone: '01713-373302' },
  { name: 'Pahartali Thana', lat: 22.3620, lng: 91.7820, phone: '01713-373303' },
  { name: 'Cox\'s Bazar Sadar Model Thana', lat: 21.4390, lng: 91.9760, phone: '01713-373350' },
  { name: 'Kotwali Model Thana, Comilla', lat: 23.4610, lng: 91.1810, phone: '01713-373400' },

  // --- Rajshahi & Rangpur Division ---
  { name: 'Boalia Model Thana, Rajshahi', lat: 24.3680, lng: 88.6010, phone: '01713-373500' },
  { name: 'Motihar Thana, Rajshahi', lat: 24.3640, lng: 88.6320, phone: '01713-373501' },
  { name: 'Kotwali Thana, Rangpur', lat: 25.7480, lng: 89.2480, phone: '01713-373600' },

  // --- Sylhet, Barishal & Mymensingh Division ---
  { name: 'Kotwali Model Thana, Sylhet', lat: 24.8960, lng: 91.8720, phone: '01713-373700' },
  { name: 'Shah Paran Thana, Sylhet', lat: 24.9080, lng: 91.9050, phone: '01713-373701' },
  { name: 'Kotwali Model Thana, Barishal', lat: 22.7040, lng: 90.3700, phone: '01713-373900' },
  { name: 'Kotwali Model Thana, Mymensingh', lat: 24.7560, lng: 90.4060, phone: '01713-373800' }
];

// ═════════════════════════════════════════════════════════════════
// 🌐 Overpass API Query & Caching Engine
// ═════════════════════════════════════════════════════════════════
// userPoliceCache: socketId -> { lastFetchLat, lastFetchLng, stations: [...] }
const userPoliceCache = {};

async function fetchOverpassPoliceStations(lat, lng) {
  try {
    const query = `[out:json][timeout:4];node["amenity"="police"](around:8000,${lat},${lng});out 10;`;
    const url = `https://overpass-api.de/api/interpreter?data=${encodeURIComponent(query)}`;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3500);

    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timeout);

    if (!res.ok) return [];
    const data = await res.json();
    if (!data || !Array.isArray(data.elements)) return [];

    return data.elements.map(el => ({
      name: (el.tags && (el.tags.name || el.tags['name:en'])) || 'Police Station',
      lat: el.lat,
      lng: el.lon,
      phone: (el.tags && (el.tags.phone || el.tags['contact:phone'])) || '999'
    }));
  } catch (err) {
    // Graceful fallback to built-in stations on timeout / network error
    return [];
  }
}

function computeNearestPolice(lat, lng, candidateStations) {
  const withDist = (candidateStations || FALLBACK_POLICE_STATIONS).map(s => {
    const dist = getDistanceMeters(lat, lng, s.lat, s.lng);
    return {
      name: s.name,
      lat: s.lat,
      lng: s.lng,
      distanceMeters: Math.round(dist),
      phone: s.phone || '999'
    };
  });

  withDist.sort((a, b) => a.distanceMeters - b.distanceMeters);

  return {
    nearestPolice: withDist[0] || null,
    nearbyPoliceList: withDist.slice(0, 3)
  };
}

// In-memory store of active emergencies keyed by socket.id
const activeEmergencies = {};

io.on('connection', (socket) => {
  console.log(`[CONNECT] Client connected: ${socket.id}`);

  // Send current active emergencies to the newly connected client
  socket.emit('initial-data', activeEmergencies);

  // Handle incoming SOS location updates
  socket.on('sos-location', (data) => {
    if (!data) return;
    const lat = parseFloat(data.lat);
    const lng = parseFloat(data.lng);
    if (isNaN(lat) || isNaN(lng)) return;

    const now = Date.now();
    const bdTime = getBDTime();

    if (!activeEmergencies[socket.id]) {
      // First update for this socket.id: immediately calculate police from fallback dataset
      const policeResult = computeNearestPolice(lat, lng, FALLBACK_POLICE_STATIONS);
      userPoliceCache[socket.id] = {
        lastFetchLat: lat,
        lastFetchLng: lng,
        stations: FALLBACK_POLICE_STATIONS
      };

      activeEmergencies[socket.id] = {
        socketId: socket.id,
        name: data.name || 'Anonymous',
        gender: data.gender || 'Other',
        phone: data.phone || 'N/A',
        lat,
        lng,
        speed: 0,
        timestamp: bdTime,
        startLocation: {
          lat,
          lng,
          time: bdTime
        },
        pathHistory: [
          [lat, lng]
        ],
        distanceTraveled: 0,
        lastUpdateTime: now,
        stationaryTicks: 0,
        nearestPolice: policeResult.nearestPolice,
        nearbyPoliceList: policeResult.nearbyPoliceList,
        isNew: true
      };

      console.log(`[SOS-NEW] ${activeEmergencies[socket.id].name} started SOS @ (${lat}, ${lng}) at ${bdTime} (BST) | Nearest: ${policeResult.nearestPolice ? policeResult.nearestPolice.name : 'N/A'}`);

      // Query Overpass asynchronously to augment with live OpenStreetMap police data
      fetchOverpassPoliceStations(lat, lng).then(overpassStations => {
        if (overpassStations && overpassStations.length > 0 && activeEmergencies[socket.id]) {
          const combined = [...overpassStations, ...FALLBACK_POLICE_STATIONS];
          userPoliceCache[socket.id] = { lastFetchLat: lat, lastFetchLng: lng, stations: combined };
          const u = activeEmergencies[socket.id];
          const updated = computeNearestPolice(u.lat, u.lng, combined);
          u.nearestPolice = updated.nearestPolice;
          u.nearbyPoliceList = updated.nearbyPoliceList;
          io.emit('update-admin', activeEmergencies);
        }
      }).catch(() => {});

    } else {
      // Subsequent location updates for existing SOS
      const user = activeEmergencies[socket.id];
      if (data.name) user.name = data.name;
      if (data.gender) user.gender = data.gender;
      if (data.phone) user.phone = data.phone;

      const lastPoint = user.pathHistory[user.pathHistory.length - 1];
      const prevLat = Array.isArray(lastPoint) ? parseFloat(lastPoint[0]) : parseFloat(lastPoint.lat);
      const prevLng = Array.isArray(lastPoint) ? parseFloat(lastPoint[1]) : parseFloat(lastPoint.lng);

      const segmentDist = getDistanceMeters(prevLat, prevLng, lat, lng);
      const timeDiffSec = Math.max(1, (now - (user.lastUpdateTime || now)) / 1000);

      // Strict minimum movement threshold: 4.0 meters (filters out indoor GPS jitter & drifting)
      if (segmentDist >= 4.0) {
        user.distanceTraveled = (user.distanceTraveled || 0) + segmentDist;
        const calculatedSpeedKmh = (segmentDist / timeDiffSec) * 3.6;

        // Realistic speed cap to filter out GPS teleportation glitches (> 140 km/h)
        const validSpeed = calculatedSpeedKmh <= 140 ? calculatedSpeedKmh : 0;

        user.speed = data.speed && parseFloat(data.speed) > 0
          ? parseFloat(data.speed)
          : parseFloat(validSpeed.toFixed(1));

        user.pathHistory.push([lat, lng]);
        user.lastUpdateTime = now;
        user.stationaryTicks = 0;
      } else {
        // Stationary / jitter < 4.0m: do NOT push to pathHistory, do NOT add distance, force speed to 0
        user.stationaryTicks = (user.stationaryTicks || 0) + 1;
        user.speed = 0;
      }

      // If user has been stationary or without movement updates for over 5 seconds, ensure speed = 0
      if (now - (user.lastUpdateTime || now) > 5000) {
        user.speed = 0;
      }

      // Always update live coordinates and timestamp in Bangladesh Standard Time
      user.lat = lat;
      user.lng = lng;
      user.timestamp = bdTime;
      user.isNew = false;

      // Check if police lookup cache needs refreshing (moved > 500m)
      const cache = userPoliceCache[socket.id] || { lastFetchLat: lat, lastFetchLng: lng, stations: FALLBACK_POLICE_STATIONS };
      const distFromCache = getDistanceMeters(cache.lastFetchLat, cache.lastFetchLng, lat, lng);

      if (distFromCache > 500) {
        userPoliceCache[socket.id] = { lastFetchLat: lat, lastFetchLng: lng, stations: cache.stations };
        fetchOverpassPoliceStations(lat, lng).then(overpassStations => {
          if (overpassStations && overpassStations.length > 0 && activeEmergencies[socket.id]) {
            const combined = [...overpassStations, ...FALLBACK_POLICE_STATIONS];
            userPoliceCache[socket.id] = { lastFetchLat: lat, lastFetchLng: lng, stations: combined };
            const u = activeEmergencies[socket.id];
            const updated = computeNearestPolice(u.lat, u.lng, combined);
            u.nearestPolice = updated.nearestPolice;
            u.nearbyPoliceList = updated.nearbyPoliceList;
            io.emit('update-admin', activeEmergencies);
          }
        }).catch(() => {});
      }

      // Always dynamically update exact distance to closest police stations from new [lat, lng]
      const policeResult = computeNearestPolice(lat, lng, cache.stations);
      user.nearestPolice = policeResult.nearestPolice;
      user.nearbyPoliceList = policeResult.nearbyPoliceList;

      console.log(`[SOS-UPDATE] ${user.name} @ (${lat}, ${lng}) | Points: ${user.pathHistory.length} | Dist: ${Math.round(user.distanceTraveled)}m | Speed: ${user.speed} km/h | Nearest Police: ${user.nearestPolice ? user.nearestPolice.name + ' (' + user.nearestPolice.distanceMeters + 'm)' : 'N/A'}`);
    }

    // Immediately broadcast updated emergencies to ALL connected clients
    io.emit('update-admin', activeEmergencies);
  });

  // Handle user voluntarily stopping SOS
  socket.on('stop-sos', () => {
    if (activeEmergencies[socket.id]) {
      console.log(`[SAFE] ${activeEmergencies[socket.id].name} marked safe.`);
      delete activeEmergencies[socket.id];
      delete userPoliceCache[socket.id];
      io.emit('update-admin', activeEmergencies);
    }
  });

  // Automatically clean up on disconnect
  socket.on('disconnect', () => {
    if (activeEmergencies[socket.id]) {
      console.log(`[DISCONNECT] Removing ${activeEmergencies[socket.id].name}`);
      delete activeEmergencies[socket.id];
      delete userPoliceCache[socket.id];
      io.emit('update-admin', activeEmergencies);
    }
    console.log(`[DISCONNECT] Client disconnected: ${socket.id}`);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`\n🛡️  SAFEGUARD LIVE server running on http://localhost:${PORT}\n`);
});
