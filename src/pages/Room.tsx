
import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { usePoll } from '@/contexts/PollContext';

const Room = () => {
  const { roomId } = useParams<{ roomId: string }>();
  const { state, joinRoom } = usePoll();
  const navigate = useNavigate();

  useEffect(() => {
    if (!state.currentUser?.name) {
      // Redirect to login if not logged in
      navigate('/?room=' + roomId);
      return;
    }

    if (roomId) {
      joinRoom(roomId);
    }
  }, [roomId, state.currentUser, joinRoom, navigate]);

  // If the room is loaded, the PollContext will handle rendering the PollRoom component
  // This component just handles the initial join logic

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-slate-100 p-4">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold">Joining room {roomId}...</h2>
        <p className="text-gray-600">Please wait while we connect to the room.</p>
      </div>
    </div>
  );
};

export default Room;
