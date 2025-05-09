
import React from 'react';
import { Button } from '@/components/ui/button';
import { usePoll } from '@/contexts/PollContext';
import { Copy } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';

const Header: React.FC = () => {
  const { state, logout } = usePoll();
  const { currentUser, currentRoom } = state;

  const shareCurrentPoll = () => {
    if (!currentRoom) return;
    
    const shareUrl = `${window.location.origin}?room=${currentRoom.id}`;
    navigator.clipboard.writeText(shareUrl).then(
      () => {
        toast({
          title: "Share Link Copied",
          description: "Poll share link has been copied to clipboard",
        });
      },
      (err) => {
        toast({
          title: "Error",
          description: "Could not copy share link: " + err,
          variant: "destructive"
        });
      }
    );
  };

  return (
    <header className="bg-slate-800 text-white py-4 px-6 flex justify-between items-center">
      <div className="flex items-center gap-2">
        <h1 className="font-bold text-xl">Live Poll Battleground</h1>
      </div>

      <div className="flex items-center gap-3">
        {currentRoom && (
          <Button variant="outline" size="sm" onClick={shareCurrentPoll}>
            <Copy size={16} className="mr-2" /> Share Poll
          </Button>
        )}
        
        {currentUser && currentUser.name && (
          <div className="flex items-center gap-2">
            <span className="text-sm hidden sm:inline-block">Logged in as: <b>{currentUser.name}</b></span>
            <Button variant="outline" size="sm" onClick={logout}>
              Logout
            </Button>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
