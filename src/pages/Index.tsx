
import React from 'react';
import { usePoll } from '@/contexts/PollContext';
import Header from '@/components/Header';
import Login from '@/components/Login';
import CreateRoom from '@/components/CreateRoom';
import PollRoom from '@/components/PollRoom';

const Index = () => {
  const { state } = usePoll();
  const { currentUser, currentRoom } = state;

  return (
    <div className="flex flex-col min-h-screen bg-slate-100">
      <Header />
      <main className="flex-1 p-4 md:p-8">
        {!currentUser?.name ? (
          <div className="flex items-center justify-center h-full">
            <Login />
          </div>
        ) : !currentRoom ? (
          <div className="pt-8">
            <CreateRoom />
          </div>
        ) : (
          <div className="pt-8">
            <PollRoom />
          </div>
        )}
      </main>
      <footer className="bg-slate-800 text-white p-4 text-center text-sm">
        <p>&copy; {new Date().getFullYear()} Live Poll Battleground</p>
      </footer>
    </div>
  );
};

export default Index;
