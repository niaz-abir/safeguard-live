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

// In-memory store of active emergencies keyed by socket.id
const activeEmergencies = {};

io.on('connection', (socket) => {
  console.log(`[CONNECT] Client connected: ${socket.id}`);

  // Send current active emergencies to the newly connected client
  socket.emit('initial-data', activeEmergencies);

  // Handle incoming SOS location updates
  socket.on('sos-location', (data) => {
    const { name, gender, phone, lat, lng } = data;
    const isNew = !activeEmergencies[socket.id];

    activeEmergencies[socket.id] = {
      name: name || 'Anonymous',
      gender: gender || 'Other',
      phone: phone || 'N/A',
      lat,
      lng,
      timestamp: Date.now(),
      isNew // flag so clients can detect a brand-new alert
    };

    console.log(`[SOS] ${activeEmergencies[socket.id].name} @ (${lat}, ${lng})`);

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
