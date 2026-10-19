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

// Haversine formula to calculate distance between two coordinates in meters
function getDistanceMeters(lat1, lon1, lat2, lon2) {
  const R = 6371e3; // Earth radius in meters
  const toRad = (deg) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
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
    const { name, gender, phone, lat, lng, speed } = data;
    const now = Date.now();
    const currentSpeed = typeof speed === 'number' && !isNaN(speed) ? Math.max(0, speed) : 0;

    if (!activeEmergencies[socket.id]) {
      // First location for this socket
      activeEmergencies[socket.id] = {
        socketId: socket.id,
        name: name || 'Anonymous',
        gender: gender || 'Other',
        phone: phone || 'N/A',
        lat,
        lng,
        speed: currentSpeed,
        timestamp: now,
        startLocation: {
          lat,
          lng,
          time: now
        },
        pathHistory: [
          { lat, lng, timestamp: now }
        ],
        distanceTraveled: 0,
        isNew: true
      };

      console.log(`[SOS-NEW] ${activeEmergencies[socket.id].name} started SOS @ (${lat}, ${lng})`);
    } else {
      // Subsequent location updates for existing SOS
      const user = activeEmergencies[socket.id];
      user.name = name || user.name;
      user.gender = gender || user.gender;
      user.phone = phone || user.phone;
      user.lat = lat;
      user.lng = lng;
      user.speed = currentSpeed;
      user.timestamp = now;
      user.isNew = false;

      // Distance from the previous recorded point
      const lastPoint = user.pathHistory[user.pathHistory.length - 1];
      let distMeters = 0;
      if (lastPoint) {
        distMeters = getDistanceMeters(lastPoint.lat, lastPoint.lng, lat, lng);
      }

      // Avoid adding duplicate consecutive points if moved less than 2 meters
      if (!lastPoint || distMeters >= 2) {
        user.pathHistory.push({ lat, lng, timestamp: now });
        user.distanceTraveled = (user.distanceTraveled || 0) + distMeters;
      }

      console.log(`[SOS-UPDATE] ${user.name} @ (${lat}, ${lng}) | Points: ${user.pathHistory.length} | Dist: ${Math.round(user.distanceTraveled)}m | Speed: ${currentSpeed} km/h`);
    }

    // Broadcast updated emergencies to ALL connected clients
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
