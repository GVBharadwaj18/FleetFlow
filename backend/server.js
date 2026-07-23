import connectDB from './config/db.js';
import app from './src/app.js';
import http from 'http';
import { initSocket } from './src/socket.js';
import { startTelemetryStream } from './src/services/telemetryStream.js';

if (process.env.NODE_ENV !== 'test') {
    connectDB();

    const PORT = process.env.PORT || 3000;
    
    // Create HTTP Server
    const server = http.createServer(app);
    
    // Initialize Socket.io
    initSocket(server);

    // Start Telemetry simulation stream
    startTelemetryStream();

    server.listen(PORT, "0.0.0.0", () => {
        console.log(`🚀 Server running on port ${PORT}`);
    });
}

