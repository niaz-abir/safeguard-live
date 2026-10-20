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
      // First update for this socket.id
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
        isNew: true
      };

      console.log(`[SOS-NEW] ${activeEmergencies[socket.id].name} started SOS @ (${lat}, ${lng}) at ${bdTime} (BST)`);
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

      console.log(`[SOS-UPDATE] ${user.name} @ (${lat}, ${lng}) | Points: ${user.pathHistory.length} | Dist: ${Math.round(user.distanceTraveled)}m | Speed: ${user.speed} km/h | Time: ${bdTime}`);
    }

    // Immediately broadcast updated emergencies to ALL connected clients
    io.emit('update-admin', activeEmergencies);
  });

  // Handle user voluntarily stopping SOS
  socket.on('stop-sos', () => {
    if (activeEmergencies[socket.id]) {
      console.log(`[SAFE] ${activeEmergencies[socket.id].name} marked safe.`);
      delete activeEmergencies[socket.id];
      io.emit('update-admin', activeEmergencies);
    }
  });

  // Automatically clean up on disconnect
  socket.on('disconnect', () => {
    if (activeEmergencies[socket.id]) {
      console.log(`[DISCONNECT] Removing ${activeEmergencies[socket.id].name}`);
      delete activeEmergencies[socket.id];
      io.emit('update-admin', activeEmergencies);
    }
    console.log(`[DISCONNECT] Client disconnected: ${socket.id}`);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`\n🛡️  SAFEGUARD LIVE server running on http://localhost:${PORT}\n`);
});
