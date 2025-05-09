
export interface User {
  id: string;
  name: string;
}

export interface Vote {
  userId: string;
  option: string;
}

export interface PollRoom {
  id: string;
  question: string;
  options: string[];
  votes: Vote[];
  createdAt: number;
  expiresAt: number;
  isActive: boolean;
  allowMultipleAnswers?: boolean;
}

export interface PollSettings {
  question: string;
  options: string[];
  allowMultipleAnswers: boolean;
}

export interface JoinRoomResponse {
  success: boolean;
  room?: PollRoom;
  error?: string;
}

export interface CreateRoomResponse {
  success: boolean;
  roomId?: string;
  error?: string;
}
