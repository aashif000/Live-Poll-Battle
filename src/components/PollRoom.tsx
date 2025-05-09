
import React, { useEffect } from 'react';
import { usePoll } from '@/contexts/PollContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Copy } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import { Checkbox } from '@/components/ui/checkbox';

const PollRoom: React.FC = () => {
  const { state, castVote, leaveRoom, timeRemaining } = usePoll();
  const { currentRoom, currentUser } = state;

  if (!currentRoom || !currentUser) return null;

  const { question, options, votes, isActive, allowMultipleAnswers } = currentRoom;

  const userVotes = votes.filter(vote => vote.userId === currentUser.id);
  const hasVoted = userVotes.length > 0;
  const userVotedOptions = userVotes.map(vote => vote.option);
  
  // Count votes for each option
  const voteCounts = options.reduce((acc, option) => {
    acc[option] = votes.filter(vote => vote.option === option).length;
    return acc;
  }, {} as Record<string, number>);

  const totalVotes = votes.length;

  // Calculate percentages
  const votePercentages = options.reduce((acc, option) => {
    const count = voteCounts[option] || 0;
    acc[option] = totalVotes > 0 ? Math.round((count / totalVotes) * 100) : 0;
    return acc;
  }, {} as Record<string, number>);

  const handleVote = (option: string) => {
    if (allowMultipleAnswers || !hasVoted) {
      castVote(option);
    } else if (!allowMultipleAnswers && hasVoted) {
      toast({
        title: "Already voted",
        description: "Multiple votes are not allowed in this poll",
        variant: "destructive"
      });
    }
  };
  
  const copyToClipboard = (text: string, message: string) => {
    navigator.clipboard.writeText(text).then(
      () => {
        toast({
          title: "Copied",
          description: message,
        });
      },
      (err) => {
        toast({
          title: "Error",
          description: "Could not copy text: " + err,
          variant: "destructive"
        });
      }
    );
  };
  
  const shareUrl = `${window.location.origin}?room=${currentRoom.id}`;

  const formatTime = (seconds: number | null): string => {
    if (seconds === null) return "--:--";
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="text-xl md:text-2xl">{question}</CardTitle>
          <div className="flex items-center gap-2">
            {isActive ? (
              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                Active
              </Badge>
            ) : (
              <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                Ended
              </Badge>
            )}
            {isActive && timeRemaining !== null && (
              <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                {formatTime(timeRemaining)}
              </Badge>
            )}
          </div>
        </div>
        <CardDescription className="flex flex-wrap items-center gap-2 mt-2">
          <div className="flex items-center gap-2">
            Room Code: <span className="font-semibold">{currentRoom.id}</span>
            <Button
              variant="ghost"
              size="sm"
              className="p-1 h-auto"
              onClick={() => copyToClipboard(currentRoom.id, "Room code copied to clipboard")}
              title="Copy room code"
            >
              <Copy size={14} />
            </Button>
          </div>
          <span className="hidden sm:inline">•</span>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              className="text-xs p-1 h-auto"
              onClick={() => copyToClipboard(shareUrl, "Share URL copied to clipboard")}
            >
              Copy Share Link
              <Copy size={14} className="ml-1" />
            </Button>
          </div>
          <span className="hidden sm:inline">•</span>
          <span>{totalVotes} {totalVotes === 1 ? 'vote' : 'votes'} so far</span>
          {allowMultipleAnswers && (
            <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
              Multiple Answers Allowed
            </Badge>
          )}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {options.map((option, index) => {
          const isVoted = userVotedOptions.includes(option);
          
          return (
            <div key={index} className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="font-medium">{option}</span>
                <span className="text-sm text-gray-500">{votePercentages[option]}% ({voteCounts[option] || 0})</span>
              </div>
              <div className="relative">
                <Progress value={votePercentages[option]} className="h-8" />
                {isVoted && (
                  <Badge className="absolute right-2 top-1/2 transform -translate-y-1/2">
                    Your Vote
                  </Badge>
                )}
              </div>
              {allowMultipleAnswers ? (
                <div className="flex items-center gap-2 mt-1">
                  <Checkbox 
                    id={`option-${index}`} 
                    checked={isVoted}
                    disabled={!isActive}
                    onCheckedChange={() => handleVote(option)}
                  />
                  <label htmlFor={`option-${index}`} className="text-sm">
                    {isVoted ? 'Selected' : 'Select this option'}
                  </label>
                </div>
              ) : (
                <Button
                  onClick={() => handleVote(option)}
                  disabled={(hasVoted && !allowMultipleAnswers) || !isActive}
                  variant={isVoted ? "default" : "outline"}
                  className="w-full mt-1"
                >
                  {isVoted ? 'Voted' : 'Vote'}
                </Button>
              )}
            </div>
          );
        })}
        
        {!isActive && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4 text-center text-yellow-700">
            <p className="text-lg font-medium">Poll has ended</p>
            <p className="text-sm">Results are final. Thanks for participating!</p>
          </div>
        )}
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button variant="ghost" onClick={leaveRoom}>
          Leave Room
        </Button>
        <div className="text-sm text-gray-500">
          {isActive 
            ? allowMultipleAnswers 
              ? 'You can select multiple options' 
              : (hasVoted ? 'You\'ve already voted' : 'Cast your vote')
            : 'Voting has ended'
          }
        </div>
      </CardFooter>
    </Card>
  );
};

export default PollRoom;
