
# Live Poll Battleground

A real-time poll application where users can create or join poll rooms and participate in voting. The results update instantly across all connected users.

## Features

- User authentication with unique names (no password required)
- Create new poll rooms with custom questions and options (up to 12 options)
- Allow single or multiple answers per poll
- Join existing rooms via room codes or URLs
- Real-time voting with instant updates
- 60-second countdown timer for each poll
- Vote persistence across page refreshes using localStorage
- Prevention of multiple votes from the same user (unless multiple answers are allowed)
- Poll results display with percentage visualization

## Quick Start Guide

### Initial Setup

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
   
   If you encounter network errors during installation, try the following:
   ```bash
   # Clear npm cache
   npm cache clean --force
   
   # Use a different registry
   npm config set registry https://registry.npmjs.org/
   
   # Try again
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```
   
4. Open the application in your browser at the URL shown in the terminal (typically http://localhost:5173 or http://localhost:8080)

### Running Modes

#### Development Mode (Default)

By default, the application runs with a simulated WebSocket server:

- No backend setup required
- Poll data is stored in browser localStorage
- Perfect for UI development and testing

If you see "Using simulated WebSocket connection for development" in the browser console, this is expected behavior in development mode.

#### Production Mode (With Real Backend)

For a full production setup with real-time functionality across devices:

1. Set up the Node.js server (see Server Setup below)
2. Update the `SOCKET_URL` in `src/services/socketService.ts` to point to your server
3. Run both the frontend and backend servers

## Troubleshooting

### Common Issues

**"npm install" Fails with Network Errors**
- This usually indicates network connectivity issues
- Try using a more stable internet connection
- If behind a proxy, configure npm:
  ```
  npm config set proxy http://your-proxy-address:port
  npm config set https-proxy http://your-proxy-address:port
  ```
- Try alternative package managers:
  ```
  # Using yarn
  npm install -g yarn
  yarn
  
  # Using pnpm
  npm install -g pnpm
  pnpm install
  ```

**"npm run dev" Fails**
- Make sure all dependencies are properly installed
- Update npm to the latest version:
  ```
  npm install -g npm@latest
  ```
- Clear the npm cache:
  ```
  npm cache clean --force
  ```

**Polls Not Working**
- Check if you're properly connected (look for connection messages in browser console)
- Ensure localStorage is enabled in your browser
- Try clearing browser cache and localStorage
- If using a backend, verify the server is running and accessible

## Server Setup

This project is designed to work with a Node.js backend using Socket.IO. Here's how to set up a basic server:

1. Create a new directory for your server
2. Initialize a new Node.js project: `npm init -y`
3. Install required dependencies:
   ```
   npm install express socket.io cors
   ```
4. Do `cd poll-server`
5. Start the server: `node server.js`

## Browser Support

This application works best in modern browsers with support for:
- ES6+ JavaScript
- localStorage API
- WebSockets (for production mode with real backend)

## Technologies Used

- React with TypeScript
- Tailwind CSS for styling
- shadcn/ui for UI components
- Socket.IO client for WebSocket communication
- React Context API for state management

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License. See the LICENSE file for details.
