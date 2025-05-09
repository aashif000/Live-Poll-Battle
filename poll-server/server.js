
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
app.use(cors());
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// Store rooms in memory
const rooms = new Map();

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);
  
  // Join room
  socket.on('joinRoom', ({ roomId }) => {
    console.log(`User ${socket.id} attempting to join room ${roomId}`);
    const room = rooms.get(roomId);
    if (room) {
      socket.join(roomId);
      console.log(`User ${socket.id} joined room ${roomId}`);
      socket.emit('roomJoined', { success: true, room });
    } else {
      console.log(`Room ${roomId} not found`);
      socket.emit('roomJoined', { success: false, error: 'Room not found' });
    }
  });
  
  // Create room
  socket.on('createRoom', (pollSettings) => {
    const roomId = Math.random().toString(36).substring(2, 8);
    const now = Date.now();
    const room = {
      id: roomId,
      question: pollSettings.question,
      options: pollSettings.options,
      votes: [],
      createdAt: now,
      expiresAt: now + 60000, // 60 seconds from now
      isActive: true,
      allowMultipleAnswers: pollSettings.allowMultipleAnswers
    };
    
    console.log(`User ${socket.id} created room ${roomId}`);
    rooms.set(roomId, room);
    socket.join(roomId);
    socket.emit('roomCreated', { success: true, roomId });
    
    // Set timer to expire the poll
    setTimeout(() => {
      if (rooms.has(roomId)) {
        const updatedRoom = rooms.get(roomId);
        updatedRoom.isActive = false;
        rooms.set(roomId, updatedRoom);
        console.log(`Poll in room ${roomId} expired`);
        io.to(roomId).emit('pollExpired', updatedRoom);
      }
    }, 60000);
  });
  
  // Cast vote
  socket.on('castVote', ({ roomId, option }) => {
    if (rooms.has(roomId)) {
      const room = rooms.get(roomId);
      if (!room.isActive) {
        socket.emit('error', 'This poll has ended');
        return;
      }
      
      const userId = socket.handshake.query.username + '_' + socket.id;
      const vote = { userId, option };
      
      // Check if user already voted for this option
      const existingVote = room.votes.find(v => v.userId === userId && v.option === option);
      
      if (!existingVote) {
        // If multiple answers aren't allowed, remove any existing votes from this user
        if (!room.allowMultipleAnswers) {
          room.votes = room.votes.filter(v => v.userId !== userId);
        }
        room.votes.push(vote);
        console.log(`User ${userId} voted for option "${option}" in room ${roomId}`);
        io.to(roomId).emit('voteCast', room);
      }
    } else {
      socket.emit('error', 'Room not found');
    }
  });
  
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

// Serve a basic status endpoint
app.get('/', (req, res) => {
  res.send('Poll Server is running');
});

app.get('/api/status', (req, res) => {
  res.json({
    status: 'ok',
    activeRooms: Array.from(rooms.keys()),
  });
});

const PORT = process.env.PORT || 3001;

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
