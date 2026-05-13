import { env } from './config/env.js';
import { connectDB } from './config/database.js';
import app from './app.js';

// Initialize server
const startServer = async () => {
    try {
        await connectDB();
        
        app.listen(env.PORT, () => {
            console.log(`Server running on port ${env.PORT}`);
        });
    } catch (error) {
        console.error("Failed to start server:", error);
        process.exit(1);
    }
};

startServer();
