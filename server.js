const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const path = require("path");

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*" },
});

// Serve static files from the public directory
app.use(express.static(path.join(__dirname, "public")));

// Explicit routes for User Mode (/) and Admin Panel (/admin)
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.get(["/admin", "/admin/*"], (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// Bangladesh Standard Time (Asia/Dhaka) helper
function getBDTime() {
  return new Date().toLocaleTimeString("en-US", {
    timeZone: "Asia/Dhaka",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
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
    Math.cos(toRad(pLat1)) *
      Math.cos(toRad(pLat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// ═════════════════════════════════════════════════════════════════
// 🚓 Comprehensive Built-in Bangladesh Police Stations Dataset
// ═════════════════════════════════════════════════════════════════
const FALLBACK_POLICE_STATIONS = [
  // --- Dhaka Metropolitan & Greater Dhaka ---
  {
    name: "Dhanmondi Police Station",
    lat: 23.7465,
    lng: 90.376,
    phone: "01713-373126",
  },
  {
    name: "Kalabagan Police Station",
    lat: 23.748,
    lng: 90.382,
    phone: "01713-373129",
  },
  {
    name: "Ramna Model Thana",
    lat: 23.741,
    lng: 90.4005,
    phone: "01713-373125",
  },
  {
    name: "Shahbagh Police Station",
    lat: 23.738,
    lng: 90.3955,
    phone: "01713-373127",
  },
  {
    name: "New Market Police Station",
    lat: 23.7335,
    lng: 90.3845,
    phone: "01713-373128",
  },
  {
    name: "Mohammadpur Police Station",
    lat: 23.758,
    lng: 90.362,
    phone: "01713-373130",
  },
  {
    name: "Adabor Police Station",
    lat: 23.773,
    lng: 90.358,
    phone: "01713-373131",
  },
  {
    name: "Tejgaon Police Station",
    lat: 23.7595,
    lng: 90.391,
    phone: "01713-373135",
  },
  {
    name: "Tejgaon Industrial Thana",
    lat: 23.771,
    lng: 90.402,
    phone: "01713-373136",
  },
  {
    name: "Hatirjheel Police Station",
    lat: 23.766,
    lng: 90.409,
    phone: "01713-373137",
  },
  {
    name: "Mirpur Model Thana",
    lat: 23.807,
    lng: 90.3685,
    phone: "01713-373145",
  },
  {
    name: "Pallabi Police Station",
    lat: 23.824,
    lng: 90.364,
    phone: "01713-373146",
  },
  {
    name: "Kafrul Police Station",
    lat: 23.791,
    lng: 90.383,
    phone: "01713-373147",
  },
  {
    name: "Darus Salam Police Station",
    lat: 23.7915,
    lng: 90.354,
    phone: "01713-373148",
  },
  {
    name: "Gulshan Police Station",
    lat: 23.7925,
    lng: 90.415,
    phone: "01713-373155",
  },
  {
    name: "Banani Police Station",
    lat: 23.7937,
    lng: 90.4042,
    phone: "01713-373156",
  },
  {
    name: "Badda Police Station",
    lat: 23.782,
    lng: 90.426,
    phone: "01713-373160",
  },
  {
    name: "Bhatara Police Station",
    lat: 23.811,
    lng: 90.428,
    phone: "01713-373161",
  },
  {
    name: "Khilkhet Police Station",
    lat: 23.831,
    lng: 90.418,
    phone: "01713-373162",
  },
  {
    name: "Cantonment Police Station",
    lat: 23.823,
    lng: 90.395,
    phone: "01713-373150",
  },
  {
    name: "Airport Police Station",
    lat: 23.851,
    lng: 90.408,
    phone: "01713-373151",
  },
  {
    name: "Uttara East Thana",
    lat: 23.868,
    lng: 90.402,
    phone: "01713-373157",
  },
  {
    name: "Uttara West Thana",
    lat: 23.872,
    lng: 90.388,
    phone: "01713-373158",
  },
  {
    name: "Turag Police Station",
    lat: 23.882,
    lng: 90.372,
    phone: "01713-373152",
  },
  {
    name: "Dakshinkhan Police Station",
    lat: 23.864,
    lng: 90.427,
    phone: "01713-373153",
  },
  {
    name: "Motijheel Police Station",
    lat: 23.733,
    lng: 90.418,
    phone: "01713-373170",
  },
  {
    name: "Paltan Model Thana",
    lat: 23.736,
    lng: 90.412,
    phone: "01713-373171",
  },
  {
    name: "Khilgaon Police Station",
    lat: 23.751,
    lng: 90.428,
    phone: "01713-373172",
  },
  {
    name: "Sabujbagh Police Station",
    lat: 23.742,
    lng: 90.432,
    phone: "01713-373173",
  },
  {
    name: "Mugda Police Station",
    lat: 23.731,
    lng: 90.434,
    phone: "01713-373174",
  },
  {
    name: "Lalbagh Police Station",
    lat: 23.719,
    lng: 90.388,
    phone: "01713-373180",
  },
  {
    name: "Kotwali Thana, Dhaka",
    lat: 23.709,
    lng: 90.406,
    phone: "01713-373181",
  },
  {
    name: "Chawkbazar Police Station",
    lat: 23.717,
    lng: 90.396,
    phone: "01713-373182",
  },
  {
    name: "Hazaribagh Police Station",
    lat: 23.738,
    lng: 90.367,
    phone: "01713-373183",
  },
  {
    name: "Kamrangirchar Police Station",
    lat: 23.714,
    lng: 90.375,
    phone: "01713-373184",
  },
  {
    name: "Wari Police Station",
    lat: 23.718,
    lng: 90.418,
    phone: "01713-373185",
  },
  {
    name: "Gendaria Police Station",
    lat: 23.708,
    lng: 90.426,
    phone: "01713-373186",
  },
  {
    name: "Jatrabari Police Station",
    lat: 23.709,
    lng: 90.437,
    phone: "01713-373190",
  },
  {
    name: "Kadamtali Police Station",
    lat: 23.698,
    lng: 90.448,
    phone: "01713-373191",
  },
  {
    name: "Demra Police Station",
    lat: 23.718,
    lng: 90.489,
    phone: "01713-373192",
  },
  {
    name: "Shyampur Police Station",
    lat: 23.692,
    lng: 90.438,
    phone: "01713-373193",
  },
  {
    name: "Savar Model Thana",
    lat: 23.848,
    lng: 90.258,
    phone: "01713-373200",
  },
  {
    name: "Ashulia Police Station",
    lat: 23.901,
    lng: 90.312,
    phone: "01713-373201",
  },
  { name: "Tongi East Thana", lat: 23.896, lng: 90.407, phone: "01713-373251" },
  {
    name: "Gazipur Sadar Thana",
    lat: 23.998,
    lng: 90.423,
    phone: "01713-373250",
  },

  // --- Narail & Khulna Division ---
  {
    name: "Narail Sadar Thana",
    lat: 23.1785,
    lng: 89.502,
    phone: "01713-374150",
  },
  {
    name: "Lohagara Thana, Narail",
    lat: 23.189,
    lng: 89.654,
    phone: "01713-374151",
  },
  {
    name: "Kalia Thana, Narail",
    lat: 23.042,
    lng: 89.638,
    phone: "01713-374152",
  },
  {
    name: "Naragati Thana, Narail",
    lat: 22.956,
    lng: 89.712,
    phone: "01713-374153",
  },
  {
    name: "Kotwali Model Thana, Jashore",
    lat: 23.167,
    lng: 89.2085,
    phone: "01713-374120",
  },
  {
    name: "Jhikargachha Thana",
    lat: 23.102,
    lng: 89.132,
    phone: "01713-374121",
  },
  {
    name: "Benapole Port Thana",
    lat: 23.038,
    lng: 88.897,
    phone: "01713-374122",
  },
  {
    name: "Khulna Sadar Thana",
    lat: 22.812,
    lng: 89.564,
    phone: "01713-374100",
  },
  {
    name: "Sonadanga Model Thana",
    lat: 22.825,
    lng: 89.548,
    phone: "01713-374101",
  },
  { name: "Khalishpur Thana", lat: 22.852, lng: 89.537, phone: "01713-374102" },
  {
    name: "Daulatpur Thana, Khulna",
    lat: 22.884,
    lng: 89.516,
    phone: "01713-374103",
  },

  // --- Chattogram Division ---
  {
    name: "Kotwali Thana, Chattogram",
    lat: 22.338,
    lng: 91.834,
    phone: "01713-373300",
  },
  { name: "Panchlaish Thana", lat: 22.366, lng: 91.826, phone: "01713-373301" },
  {
    name: "Double Mooring Thana",
    lat: 22.336,
    lng: 91.808,
    phone: "01713-373302",
  },
  { name: "Pahartali Thana", lat: 22.362, lng: 91.782, phone: "01713-373303" },
  {
    name: "Cox's Bazar Sadar Model Thana",
    lat: 21.439,
    lng: 91.976,
    phone: "01713-373350",
  },
  {
    name: "Kotwali Model Thana, Comilla",
    lat: 23.461,
    lng: 91.181,
    phone: "01713-373400",
  },

  // --- Rajshahi & Rangpur Division ---
  {
    name: "Boalia Model Thana, Rajshahi",
    lat: 24.368,
    lng: 88.601,
    phone: "01713-373500",
  },
  {
    name: "Motihar Thana, Rajshahi",
    lat: 24.364,
    lng: 88.632,
    phone: "01713-373501",
  },
  {
    name: "Kotwali Thana, Rangpur",
    lat: 25.748,
    lng: 89.248,
    phone: "01713-373600",
  },

  // --- Sylhet, Barishal & Mymensingh Division ---
  {
    name: "Kotwali Model Thana, Sylhet",
    lat: 24.896,
    lng: 91.872,
    phone: "01713-373700",
  },
  {
    name: "Shah Paran Thana, Sylhet",
    lat: 24.908,
    lng: 91.905,
    phone: "01713-373701",
  },
  {
    name: "Kotwali Model Thana, Barishal",
    lat: 22.704,
    lng: 90.37,
    phone: "01713-373900",
  },
  {
    name: "Kotwali Model Thana, Mymensingh",
    lat: 24.756,
    lng: 90.406,
    phone: "01713-373800",
  },
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

    return data.elements.map((el) => ({
      name:
        (el.tags && (el.tags.name || el.tags["name:en"])) || "Police Station",
      lat: el.lat,
      lng: el.lon,
      phone: (el.tags && (el.tags.phone || el.tags["contact:phone"])) || "999",
    }));
  } catch (err) {
    // Graceful fallback to built-in stations on timeout / network error
    return [];
  }
}

function computeNearestPolice(lat, lng, candidateStations) {
  const withDist = (candidateStations || FALLBACK_POLICE_STATIONS).map((s) => {
    const dist = getDistanceMeters(lat, lng, s.lat, s.lng);
    return {
      name: s.name,
      lat: s.lat,
      lng: s.lng,
      distanceMeters: Math.round(dist),
      phone: s.phone || "999",
    };
  });

  withDist.sort((a, b) => a.distanceMeters - b.distanceMeters);

  return {
    nearestPolice: withDist[0] || null,
    nearbyPoliceList: withDist.slice(0, 3),
  };
}

// In-memory store of active emergencies keyed by socket.id
const activeEmergencies = {};

io.on("connection", (socket) => {
  console.log(`[CONNECT] Client connected: ${socket.id}`);

  // Send current active emergencies to the newly connected client
  socket.emit("initial-data", activeEmergencies);

  // Handle incoming SOS location updates
  socket.on("sos-location", (data) => {
    if (!data) return;
    const lat = parseFloat(data.lat);
    const lng = parseFloat(data.lng);
    if (isNaN(lat) || isNaN(lng)) return;

    const now = Date.now();
    const bdTime = getBDTime();

    if (!activeEmergencies[socket.id]) {
      // First update for this socket.id: immediately calculate police from fallback dataset
      const policeResult = computeNearestPolice(
        lat,
        lng,
        FALLBACK_POLICE_STATIONS,
      );
      userPoliceCache[socket.id] = {
        lastFetchLat: lat,
        lastFetchLng: lng,
        stations: FALLBACK_POLICE_STATIONS,
      };

      activeEmergencies[socket.id] = {
        socketId: socket.id,
        name: data.name || "Anonymous",
        gender: data.gender || "Other",
        phone: data.phone || "N/A",
        lat,
        lng,
        speed: 0,
        timestamp: bdTime,
        startLocation: {
          lat,
          lng,
          time: bdTime,
        },
        pathHistory: [[lat, lng]],
        distanceTraveled: 0,
        lastUpdateTime: now,
        stationaryTicks: 0,
        nearestPolice: policeResult.nearestPolice,
        nearbyPoliceList: policeResult.nearbyPoliceList,
        isNew: true,
      };

      console.log(
        `[SOS-NEW] ${activeEmergencies[socket.id].name} started SOS @ (${lat}, ${lng}) at ${bdTime} (BST) | Nearest: ${policeResult.nearestPolice ? policeResult.nearestPolice.name : "N/A"}`,
      );

      // Query Overpass asynchronously to augment with live OpenStreetMap police data
      fetchOverpassPoliceStations(lat, lng)
        .then((overpassStations) => {
          if (
            overpassStations &&
            overpassStations.length > 0 &&
            activeEmergencies[socket.id]
          ) {
            const combined = [...overpassStations, ...FALLBACK_POLICE_STATIONS];
            userPoliceCache[socket.id] = {
              lastFetchLat: lat,
              lastFetchLng: lng,
              stations: combined,
            };
            const u = activeEmergencies[socket.id];
            const updated = computeNearestPolice(u.lat, u.lng, combined);
            u.nearestPolice = updated.nearestPolice;
            u.nearbyPoliceList = updated.nearbyPoliceList;
            io.emit("update-admin", activeEmergencies);
          }
        })
        .catch(() => {});
    } else {
      // Subsequent location updates for existing SOS
      const user = activeEmergencies[socket.id];
      if (data.name) user.name = data.name;
      if (data.gender) user.gender = data.gender;
      if (data.phone) user.phone = data.phone;

      const lastPoint = user.pathHistory[user.pathHistory.length - 1];
      const prevLat = Array.isArray(lastPoint)
        ? parseFloat(lastPoint[0])
        : parseFloat(lastPoint.lat);
      const prevLng = Array.isArray(lastPoint)
        ? parseFloat(lastPoint[1])
        : parseFloat(lastPoint.lng);

      const segmentDist = getDistanceMeters(prevLat, prevLng, lat, lng);
      const timeDiffSec = Math.max(
        1,
        (now - (user.lastUpdateTime || now)) / 1000,
      );

      // Strict minimum movement threshold: 4.0 meters (filters out indoor GPS jitter & drifting)
      if (segmentDist >= 4.0) {
        user.distanceTraveled = (user.distanceTraveled || 0) + segmentDist;
        const calculatedSpeedKmh = (segmentDist / timeDiffSec) * 3.6;

        // Realistic speed cap to filter out GPS teleportation glitches (> 140 km/h)
        const validSpeed = calculatedSpeedKmh <= 140 ? calculatedSpeedKmh : 0;

        user.speed =
          data.speed && parseFloat(data.speed) > 0
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
      const cache = userPoliceCache[socket.id] || {
        lastFetchLat: lat,
        lastFetchLng: lng,
        stations: FALLBACK_POLICE_STATIONS,
      };
      const distFromCache = getDistanceMeters(
        cache.lastFetchLat,
        cache.lastFetchLng,
        lat,
        lng,
      );

      if (distFromCache > 500) {
        userPoliceCache[socket.id] = {
          lastFetchLat: lat,
          lastFetchLng: lng,
          stations: cache.stations,
        };
        fetchOverpassPoliceStations(lat, lng)
          .then((overpassStations) => {
            if (
              overpassStations &&
              overpassStations.length > 0 &&
              activeEmergencies[socket.id]
            ) {
              const combined = [
                ...overpassStations,
                ...FALLBACK_POLICE_STATIONS,
              ];
              userPoliceCache[socket.id] = {
                lastFetchLat: lat,
                lastFetchLng: lng,
                stations: combined,
              };
              const u = activeEmergencies[socket.id];
              const updated = computeNearestPolice(u.lat, u.lng, combined);
              u.nearestPolice = updated.nearestPolice;
              u.nearbyPoliceList = updated.nearbyPoliceList;
              io.emit("update-admin", activeEmergencies);
            }
          })
          .catch(() => {});
      }

      // Always dynamically update exact distance to closest police stations from new [lat, lng]
      const policeResult = computeNearestPolice(lat, lng, cache.stations);
      user.nearestPolice = policeResult.nearestPolice;
      user.nearbyPoliceList = policeResult.nearbyPoliceList;

      console.log(
        `[SOS-UPDATE] ${user.name} @ (${lat}, ${lng}) | Points: ${user.pathHistory.length} | Dist: ${Math.round(user.distanceTraveled)}m | Speed: ${user.speed} km/h | Nearest Police: ${user.nearestPolice ? user.nearestPolice.name + " (" + user.nearestPolice.distanceMeters + "m)" : "N/A"}`,
      );
    }

    // Immediately broadcast updated emergencies to ALL connected clients
    io.emit("update-admin", activeEmergencies);
  });

  // Handle user voluntarily stopping SOS
  socket.on("stop-sos", () => {
    if (activeEmergencies[socket.id]) {
      console.log(`[SAFE] ${activeEmergencies[socket.id].name} marked safe.`);
      delete activeEmergencies[socket.id];
      delete userPoliceCache[socket.id];
      io.emit("update-admin", activeEmergencies);
    }
  });

  // Automatically clean up on disconnect
  socket.on("disconnect", () => {
    if (activeEmergencies[socket.id]) {
      console.log(`[DISCONNECT] Removing ${activeEmergencies[socket.id].name}`);
      delete activeEmergencies[socket.id];
      delete userPoliceCache[socket.id];
      io.emit("update-admin", activeEmergencies);
    }
    console.log(`[DISCONNECT] Client disconnected: ${socket.id}`);
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(
    `\n🛡️  SAFEGUARD LIVE server running on http://localhost:${PORT}\n`,
  );
});
