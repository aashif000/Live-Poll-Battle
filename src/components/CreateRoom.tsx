
import React, { useState } from 'react';
import { usePoll } from '@/contexts/PollContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Checkbox } from '@/components/ui/checkbox';
import { Copy, Plus, Trash2 } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';

const CreateRoom: React.FC = () => {
  const { createRoom, joinRoom, state } = usePoll();
  const [question, setQuestion] = useState('Which do you prefer?');
  const [options, setOptions] = useState(['Cats', 'Dogs']);
  const [roomCode, setRoomCode] = useState('');
  const [allowMultipleAnswers, setAllowMultipleAnswers] = useState(false);
  
  const handleCreateRoom = (e: React.FormEvent) => {
    e.preventDefault();
    if (options.length < 2) {
      toast({
        title: "Error",
        description: "You need at least 2 options",
        variant: "destructive"
      });
      return;
    }
    createRoom(question, options, allowMultipleAnswers);
  };

  const handleJoinRoom = (e: React.FormEvent) => {
    e.preventDefault();
    joinRoom(roomCode);
  };
  
  const addOption = () => {
    if (options.length < 12) {
      setOptions([...options, '']);
    } else {
      toast({
        title: "Limit Reached",
        description: "You can have a maximum of 12 options",
      });
    }
  };
  
  const removeOption = (index: number) => {
    if (options.length <= 2) {
      toast({
        title: "Error",
        description: "You need at least 2 options",
        variant: "destructive"
      });
      return;
    }
    setOptions(options.filter((_, i) => i !== index));
  };
  
  const updateOption = (index: number, value: string) => {
    const newOptions = [...options];
    newOptions[index] = value;
    setOptions(newOptions);
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

  return (
    <div className="flex flex-col md:flex-row gap-6 w-full max-w-4xl mx-auto">
      <Card className="flex-1">
        <CardHeader>
          <CardTitle>Create a New Poll</CardTitle>
          <CardDescription>Start a new poll and share the code with others</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCreateRoom} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="question" className="text-sm font-medium">
                Your Question (255 characters max)
              </label>
              <Input
                id="question"
                placeholder="Enter your question"
                value={question}
                onChange={e => setQuestion(e.target.value)}
                maxLength={255}
                required
              />
            </div>
            
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <label className="text-sm font-medium">Poll Options (100 characters each, up to 12)</label>
                <Button type="button" size="sm" variant="outline" onClick={addOption}>
                  <Plus size={16} className="mr-1" /> Add Option
                </Button>
              </div>
              
              {options.map((option, index) => (
                <div key={index} className="flex gap-2">
                  <Input
                    placeholder={`Option ${index + 1}`}
                    value={option}
                    onChange={e => updateOption(index, e.target.value)}
                    maxLength={100}
                    required
                  />
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="icon"
                    onClick={() => removeOption(index)}
                    disabled={options.length <= 2}
                  >
                    <Trash2 size={16} />
                  </Button>
                </div>
              ))}
            </div>
            
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="multiple-answers" 
                checked={allowMultipleAnswers} 
                onCheckedChange={(checked) => setAllowMultipleAnswers(checked === true)}
              />
              <label
                htmlFor="multiple-answers"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Allow multiple answers
              </label>
            </div>
            
            <Button 
              type="submit" 
              className="w-full"
              disabled={!question.trim() || options.some(opt => !opt.trim()) || state.isConnecting}
            >
              Create Poll
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card className="flex-1">
        <CardHeader>
          <CardTitle>Join Existing Poll</CardTitle>
          <CardDescription>Enter a room code to join an existing poll</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleJoinRoom} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="roomCode" className="text-sm font-medium">
                Room Code
              </label>
              <div className="flex gap-2">
                <Input
                  id="roomCode"
                  placeholder="Enter room code"
                  value={roomCode}
                  onChange={e => setRoomCode(e.target.value)}
                  required
                  className="flex-1"
                />
                <Button 
                  type="button" 
                  variant="outline" 
                  size="icon"
                  onClick={() => {
                    const urlParams = new URLSearchParams(window.location.search);
                    const code = urlParams.get('room');
                    if (code) {
                      setRoomCode(code);
                      toast({
                        title: "Room Code Extracted",
                        description: `Room code ${code} has been extracted from the URL`
                      });
                    } else {
                      toast({
                        title: "No Room Code Found",
                        description: "No room code was found in the URL"
                      });
                    }
                  }}
                  title="Extract room code from URL"
                >
                  <Copy size={16} />
                </Button>
              </div>
            </div>
            
            <Button 
              type="submit" 
              className="w-full"
              disabled={!roomCode.trim() || state.isConnecting}
            >
              Join Poll
            </Button>
            
            <div className="text-center text-sm text-gray-500">
              <p>You can also join by adding <code>?room=CODE</code> to the URL</p>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default CreateRoom;
