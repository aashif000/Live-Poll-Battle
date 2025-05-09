
import React, { useState } from 'react';
import { usePoll } from '@/contexts/PollContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

const Login: React.FC = () => {
  const { login, state } = usePoll();
  const [username, setUsername] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    login(username);
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl font-bold text-center">Live Poll Battle</CardTitle>
        <CardDescription className="text-center">Enter your name to get started</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="username" className="text-sm font-medium">
              Your Name
            </label>
            <Input
              id="username"
              placeholder="Enter your name"
              value={username}
              onChange={e => setUsername(e.target.value)}
              required
              disabled={state.isConnecting}
              autoFocus
              className="w-full"
            />
          </div>
          {state.error && <p className="text-red-500 text-sm">{state.error}</p>}
          <Button 
            type="submit" 
            disabled={!username.trim() || state.isConnecting}
            className="w-full"
          >
            {state.isConnecting ? 'Connecting...' : 'Join Poll Battle'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default Login;
