
import React, { createContext, useContext, useEffect, useReducer, useState } from 'react';
import { socketService } from '../services/socketService';
import { PollRoom, JoinRoomResponse, CreateRoomResponse, PollSettings } from '../types/poll';
import { toast } from '@/components/ui/use-toast';

type PollState = {
  currentUser: {
    id: string;
    name: string;
  } | null;
  currentRoom: PollRoom | null;
  isConnecting: boolean;
  error: string | null;
};

type PollAction =
  | { type: 'SET_USER'; payload: { id: string; name: string } }
  | { type: 'SET_ROOM'; payload: PollRoom }
  | { type: 'UPDATE_ROOM'; payload: PollRoom }
  | { type: 'CLEAR_ROOM' }
  | { type: 'SET_CONNECTING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string }
  | { type: 'CLEAR_ERROR' };

type PollContextType = {
  state: PollState;
  login: (username: string) => Promise<void>;
  createRoom: (question: string, options: string[], allowMultipleAnswers?: boolean) => void;
  joinRoom: (roomId: string) => void;
  castVote: (option: string) => void;
  leaveRoom: () => void;
  logout: () => void;
  timeRemaining: number | null;
};

const initialState: PollState = {
  currentUser: null,
  currentRoom: null,
  isConnecting: false,
  error: null,
};

const pollReducer = (state: PollState, action: PollAction): PollState => {
  switch (action.type) {
    case 'SET_USER':
      return { ...state, currentUser: action.payload };
    case 'SET_ROOM':
      return { ...state, currentRoom: action.payload };
    case 'UPDATE_ROOM':
      return { ...state, currentRoom: action.payload };
    case 'CLEAR_ROOM':
      return { ...state, currentRoom: null };
    case 'SET_CONNECTING':
      return { ...state, isConnecting: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    case 'CLEAR_ERROR':
      return { ...state, error: null };
    default:
      return state;
  }
};

const PollContext = createContext<PollContextType | undefined>(undefined);

export const PollProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(pollReducer, initialState);
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);

  // Load user from localStorage on mount
  useEffect(() => {
    const userId = localStorage.getItem('userId');
    const username = localStorage.getItem('username');
    
    if (userId && username) {
      dispatch({ type: 'SET_USER', payload: { id: userId, name: username } });

      // Also check if user was in a room
      const lastRoomId = localStorage.getItem('lastRoomId');
      if (lastRoomId) {
        const roomData = localStorage.getItem(`room_${lastRoomId}`);
        if (roomData) {
          const room = JSON.parse(roomData);
          // Only restore if the poll isn't expired
          if (room.expiresAt > Date.now()) {
            dispatch({ type: 'SET_ROOM', payload: room });
            startTimer(room);
          } else {
            // Clean up expired room data
            localStorage.removeItem(`room_${lastRoomId}`);
            localStorage.removeItem('lastRoomId');
          }
        }
      }
    }

    // Check URL for room parameter
    const checkUrlForRoom = () => {
      const urlParams = new URLSearchParams(window.location.search);
      const roomId = urlParams.get('room');
      if (roomId && userId && username) {
        joinRoom(roomId);
      }
    };
    
    checkUrlForRoom();

    // Set up socket event listeners
    socketService.on('roomJoined', handleRoomJoined);
    socketService.on('roomCreated', handleRoomCreated);
    socketService.on('roomUpdated', handleRoomUpdated);
    socketService.on('error', handleError);
    
    return () => {
      socketService.off('roomJoined', handleRoomJoined);
      socketService.off('roomCreated', handleRoomCreated);
      socketService.off('roomUpdated', handleRoomUpdated);
      socketService.off('error', handleError);
    };
  }, []);

  const handleRoomJoined = (data: JoinRoomResponse) => {
    if (data.success && data.room) {
      dispatch({ type: 'SET_ROOM', payload: data.room });
      localStorage.setItem(`room_${data.room.id}`, JSON.stringify(data.room));
      localStorage.setItem('lastRoomId', data.room.id);
      startTimer(data.room);
      
      // Update the URL with the room ID
      const newUrl = new URL(window.location.href);
      newUrl.searchParams.set('room', data.room.id);
      window.history.pushState({}, '', newUrl.toString());
      
      toast({
        title: "Room Joined",
        description: `You've joined the poll: ${data.room.question}`,
      });
    } else if (data.error) {
      dispatch({ type: 'SET_ERROR', payload: data.error });
      toast({
        title: "Error",
        description: data.error,
        variant: "destructive"
      });
    }
  };

  const handleRoomCreated = (data: CreateRoomResponse) => {
    if (data.success && data.roomId) {
      toast({
        title: "Room Created",
        description: `Your room code is: ${data.roomId}`,
      });
      joinRoom(data.roomId);
    } else if (data.error) {
      dispatch({ type: 'SET_ERROR', payload: data.error });
      toast({
        title: "Error",
        description: data.error,
        variant: "destructive"
      });
    }
  };

  const handleRoomUpdated = (room: PollRoom) => {
    dispatch({ type: 'UPDATE_ROOM', payload: room });
    localStorage.setItem(`room_${room.id}`, JSON.stringify(room));
    
    // Update timer if needed
    if (room.isActive) {
      startTimer(room);
    } else {
      setTimeRemaining(0);
      toast({
        title: "Poll Ended",
        description: "The voting period has ended.",
      });
    }
  };

  const handleError = (error: string) => {
    dispatch({ type: 'SET_ERROR', payload: error });
    toast({
      title: "Error",
      description: error,
      variant: "destructive"
    });
  };

  const startTimer = (room: PollRoom) => {
    // Clear any existing timer
    const countdown = () => {
      const now = Date.now();
      const remaining = Math.max(0, room.expiresAt - now);
      
      if (remaining <= 0) {
        setTimeRemaining(0);
        // Check if room is still active and update if needed
        if (room.isActive) {
          const updatedRoom = {...room, isActive: false};
          dispatch({ type: 'UPDATE_ROOM', payload: updatedRoom });
          localStorage.setItem(`room_${room.id}`, JSON.stringify(updatedRoom));
        }
        return;
      }
      
      setTimeRemaining(Math.round(remaining / 1000));
    };
    
    // Immediately set initial value
    countdown();
    
    // Then update every second
    const timerId = setInterval(countdown, 1000);
    
    // Clean up timer on unmount
    return () => clearInterval(timerId);
  };

  const login = async (username: string): Promise<void> => {
    if (!username.trim()) {
      dispatch({ type: 'SET_ERROR', payload: 'Username is required' });
      return;
    }

    dispatch({ type: 'SET_CONNECTING', payload: true });
    dispatch({ type: 'CLEAR_ERROR' });

    // Generate a unique ID for the user
    const userId = Date.now().toString(36) + Math.random().toString(36).substring(2);
    
    // Store user info in localStorage
    localStorage.setItem('userId', userId);
    localStorage.setItem('username', username);

    // Connect to socket server (or use simulation)
    await socketService.connect(username);
    
    dispatch({ type: 'SET_USER', payload: { id: userId, name: username } });
    dispatch({ type: 'SET_CONNECTING', payload: false });
    
    // Check URL for room parameter after login
    const urlParams = new URLSearchParams(window.location.search);
    const roomId = urlParams.get('room');
    if (roomId) {
      joinRoom(roomId);
    }
  };

  const createRoom = (question: string, options: string[], allowMultipleAnswers: boolean = false) => {
    if (!state.currentUser) {
      dispatch({ type: 'SET_ERROR', payload: 'You must log in first' });
      return;
    }
    
    const pollSettings: PollSettings = {
      question,
      options,
      allowMultipleAnswers
    };
    
    socketService.createRoom(pollSettings);
  };

  const joinRoom = (roomId: string) => {
    if (!state.currentUser) {
      dispatch({ type: 'SET_ERROR', payload: 'You must log in first' });
      return;
    }
    
    socketService.joinRoom(roomId);
  };

  const castVote = (option: string) => {
    if (!state.currentUser || !state.currentRoom) {
      dispatch({ type: 'SET_ERROR', payload: 'You must be in a room to vote' });
      return;
    }
    
    if (!state.currentRoom.isActive) {
      dispatch({ type: 'SET_ERROR', payload: 'This poll has ended' });
      return;
    }
    
    // Check if user already voted for this option
    const alreadyVotedForOption = state.currentRoom.votes.some(
      vote => vote.userId === state.currentUser?.id && vote.option === option
    );
    
    // Check if user already voted and multiple answers are not allowed
    const userAlreadyVoted = state.currentRoom.votes.some(
      vote => vote.userId === state.currentUser?.id
    );
    
    if (alreadyVotedForOption) {
      toast({
        title: "Already Voted",
        description: "You've already voted for this option",
        variant: "destructive"
      });
      return;
    }
    
    if (userAlreadyVoted && !state.currentRoom.allowMultipleAnswers) {
      toast({
        title: "Already Voted",
        description: "You can only vote once in this poll",
        variant: "destructive"
      });
      return;
    }
    
    socketService.castVote(state.currentRoom.id, option);
  };

  const leaveRoom = () => {
    if (state.currentRoom) {
      localStorage.removeItem('lastRoomId');
      dispatch({ type: 'CLEAR_ROOM' });
      setTimeRemaining(null);
      
      // Remove room from URL
      const newUrl = new URL(window.location.href);
      newUrl.searchParams.delete('room');
      window.history.pushState({}, '', newUrl.toString());
    }
  };

  const logout = () => {
    localStorage.removeItem('userId');
    localStorage.removeItem('username');
    localStorage.removeItem('lastRoomId');
    socketService.disconnect();
    dispatch({ type: 'SET_USER', payload: { id: '', name: '' } });
    dispatch({ type: 'CLEAR_ROOM' });
    setTimeRemaining(null);
    
    // Remove room from URL
    const newUrl = new URL(window.location.href);
    newUrl.searchParams.delete('room');
    window.history.pushState({}, '', newUrl.toString());
  };

  return (
    <PollContext.Provider
      value={{
        state,
        login,
        createRoom,
        joinRoom,
        castVote,
        leaveRoom,
        logout,
        timeRemaining
      }}
    >
      {children}
    </PollContext.Provider>
  );
};

export const usePoll = (): PollContextType => {
  const context = useContext(PollContext);
  if (context === undefined) {
    throw new Error('usePoll must be used within a PollProvider');
  }
  return context;
};
