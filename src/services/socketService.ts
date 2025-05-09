
import { io, Socket } from 'socket.io-client';
import { JoinRoomResponse, CreateRoomResponse, PollRoom, PollSettings } from '../types/poll';

// Update this URL to point to your backend server
// For local development with a real backend server running
const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3001';

class SocketService {
  private socket: Socket | null = null;
  private simulationEnabled = false;
  private simulatedRooms = new Map<string, PollRoom>();
  
  constructor() {
    // Check if we're in development environment
    this.simulationEnabled = import.meta.env.DEV && !import.meta.env.VITE_USE_REAL_SOCKET;
    
    if (this.simulationEnabled) {
      console.info('Using simulated WebSocket connection for development');
      // Load any saved rooms from localStorage
      this.loadSimulatedRoomsFromStorage();
    }
  }

  private loadSimulatedRoomsFromStorage() {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('room_')) {
        try {
          const roomData = localStorage.getItem(key);
          if (roomData) {
            const room = JSON.parse(roomData);
            this.simulatedRooms.set(room.id, room);
          }
        } catch (error) {
          console.error('Error loading simulated room from localStorage:', error);
        }
      }
    }
  }

  private simulateCreateRoom(pollSettings: PollSettings): Promise<CreateRoomResponse> {
    return new Promise((resolve) => {
      const roomId = Math.random().toString(36).substring(2, 8);
      const now = Date.now();
      const newRoom: PollRoom = {
        id: roomId,
        question: pollSettings.question,
        options: pollSettings.options,
        votes: [],
        createdAt: now,
        expiresAt: now + 60000, // 60 seconds from now
        isActive: true,
        allowMultipleAnswers: pollSettings.allowMultipleAnswers
      };
      
      this.simulatedRooms.set(roomId, newRoom);
      localStorage.setItem(`room_${roomId}`, JSON.stringify(newRoom));
      
      console.log('Simulated room created:', newRoom);
      
      // Simulate expiration after 60 seconds
      setTimeout(() => {
        if (this.simulatedRooms.has(roomId)) {
          const expiredRoom = this.simulatedRooms.get(roomId);
          if (expiredRoom) {
            expiredRoom.isActive = false;
            this.simulatedRooms.set(roomId, expiredRoom);
            localStorage.setItem(`room_${roomId}`, JSON.stringify(expiredRoom));
            console.log('Simulated room expired:', roomId);
            this.emit('pollExpired', expiredRoom); // Simulate emitting the 'pollExpired' event
          }
        }
      }, 60000);
      
      resolve({ success: true, roomId: roomId });
    });
  }

  private simulateJoinRoom(roomId: string): Promise<JoinRoomResponse> {
    return new Promise((resolve) => {
      const room = this.simulatedRooms.get(roomId);
      if (room) {
        console.log('Simulated room joined:', room);
        resolve({ success: true, room });
      } else {
        console.log('Simulated room not found:', roomId);
        resolve({ success: false, error: 'Room not found' });
      }
    });
  }

  private simulateCastVote(roomId: string, option: string): void {
    const room = this.simulatedRooms.get(roomId);
    if (room) {
      const userId = Date.now().toString(36) + Math.random().toString(36).substring(2);
      const vote = { userId: userId, option };
      room.votes.push(vote);
      this.simulatedRooms.set(roomId, room);
      localStorage.setItem(`room_${roomId}`, JSON.stringify(room));
      console.log('Simulated vote cast:', { roomId, option, userId });
      this.emit('voteCast', room); // Simulate emitting the 'voteCast' event
    } else {
      console.log('Simulated room not found:', roomId);
      this.emit('error', 'Room not found'); // Simulate emitting the 'error' event
    }
  }

  private listeners: { [event: string]: ((data: any) => void)[] } = {};

  public emit(event: string, data: any): void {
    if (this.listeners[event]) {
      this.listeners[event].forEach(callback => callback(data));
    }
  }
  
  async connect(username: string): Promise<void> {
    if (this.simulationEnabled) {
      // Simulate connection in development mode
      console.log('Simulating connection for user:', username);
      return Promise.resolve();
    }
    
    // Use real socket.io connection in production
    if (this.socket?.connected) {
      return Promise.resolve();
    }
    
    return new Promise((resolve, reject) => {
      try {
        this.socket = io(SOCKET_URL, {
          query: { username },
          transports: ['websocket', 'polling'],
          reconnection: true,
          reconnectionAttempts: 5,
          reconnectionDelay: 1000
        });
        
        this.socket.on('connect', () => {
          console.log('Connected to WebSocket server with ID:', this.socket?.id);
          resolve();
        });
        
        this.socket.on('connect_error', (error) => {
          console.error('Socket connection error:', error);
          reject(error);
        });
      } catch (error) {
        console.error('Socket initialization error:', error);
        reject(error);
      }
    });
  }
  
  disconnect(): void {
    if (this.simulationEnabled) {
      console.log('Simulated disconnection');
      return;
    }
    
    if (this.socket) {
      this.socket.disconnect();
      console.log('Disconnected from WebSocket server');
    }
  }

  createRoom(pollSettings: PollSettings): void {
    if (this.simulationEnabled) {
      this.simulateCreateRoom(pollSettings)
        .then(response => {
          if (response.success && response.roomId) {
            this.emit('roomCreated', response);
          } else {
            this.emit('error', response.error || 'Failed to create room');
          }
        });
      return;
    }
    
    if (this.socket) {
      this.socket.emit('createRoom', pollSettings);
    } else {
      console.error('Socket not connected');
    }
  }

  joinRoom(roomId: string): void {
    if (this.simulationEnabled) {
      this.simulateJoinRoom(roomId)
        .then(response => {
          if (response.success && response.room) {
            this.emit('roomJoined', response);
          } else {
            this.emit('error', response.error || 'Failed to join room');
          }
        });
      return;
    }
    
    if (this.socket) {
      this.socket.emit('joinRoom', { roomId });
    } else {
      console.error('Socket not connected');
    }
  }

  castVote(roomId: string, option: string): void {
    if (this.simulationEnabled) {
      this.simulateCastVote(roomId, option);
      return;
    }
    
    if (this.socket) {
      this.socket.emit('castVote', { roomId, option });
    } else {
      console.error('Socket not connected');
    }
  }

  on(event: string, callback: (data: any) => void): void {
    if (this.simulationEnabled) {
      // Store the callback for simulated events
      if (!this.listeners[event]) {
        this.listeners[event] = [];
      }
      this.listeners[event].push(callback);
      return;
    }
    
    if (this.socket) {
      this.socket.on(event, callback);
    } else {
      console.error('Socket not connected');
    }
  }

  off(event: string, callback: (data: any) => void): void {
    if (this.simulationEnabled) {
      // Remove the callback for simulated events
      if (this.listeners[event]) {
        this.listeners[event] = this.listeners[event].filter(cb => cb !== callback);
      }
      return;
    }
    
    if (this.socket) {
      this.socket.off(event, callback);
    } else {
      console.error('Socket not connected');
    }
  }
}

export const socketService = new SocketService();
