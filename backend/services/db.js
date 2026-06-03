const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI;
const DB_NAME = process.env.MONGODB_DB_NAME || 'nedhub_careers';

let connection = null;
let isConnecting = false;
let connectionClosed = false;

const dbConfig = {
    maxRetries: 5,
    retryInterval: 3000,
    retryWrites: true,
    w: 'majority'
};

async function connectDB(retries = 0) {
    if (connectionClosed) {
        throw new Error('Database connection closed');
    }

    if (connection && mongoose.connection.readyState === 1) {
        return connection;
    }

    if (isConnecting) {
        return new Promise((resolve, reject) => {
            const checkConnection = () => {
                if (connection && mongoose.connection.readyState === 1) {
                    resolve(connection);
                } else if (!isConnecting) {
                    reject(new Error('Connection failed'));
                } else {
                    setTimeout(checkConnection, 100);
                }
            };
            checkConnection();
        });
    }

    if (!MONGODB_URI) {
        console.warn('[DB] No MONGODB_URI provided - database functionality disabled');
        return null;
    }

    isConnecting = true;

    try {
        const options = {
            dbName: DB_NAME,
            maxPoolSize: 10,
            serverSelectionTimeoutMS: 5000,
            socketTimeoutMS: 45000,
            retryWrites: dbConfig.retryWrites,
            w: dbConfig.w
        };

        connection = await mongoose.connect(MONGODB_URI, options);
        
        mongoose.connection.on('error', (err) => {
            console.error('[DB] MongoDB connection error:', err);
        });

        mongoose.connection.on('disconnected', () => {
            console.warn('[DB] MongoDB disconnected');
            connection = null;
        });

        mongoose.connection.on('reconnected', () => {
            console.log('[DB] MongoDB reconnected');
        });

        isConnecting = false;
        console.log('[DB] MongoDB connected successfully');
        return connection;
    } catch (error) {
        isConnecting = false;
        
        if (retries < dbConfig.maxRetries) {
            console.warn(`[DB] Connection attempt ${retries + 1} failed. Retrying in ${dbConfig.retryInterval}ms...`);
            await new Promise(resolve => setTimeout(resolve, dbConfig.retryInterval));
            return connectDB(retries + 1);
        }
        
        console.error('[DB] Failed to connect to MongoDB after', dbConfig.maxRetries, 'attempts:', error.message);
        throw error;
    }
}

async function disconnectDB() {
    if (connection && mongoose.connection.readyState !== 0) {
        await mongoose.disconnect();
        connection = null;
        connectionClosed = true;
        console.log('[DB] MongoDB disconnected');
    }
}

function getDB() {
    if (!connection || mongoose.connection.readyState !== 1) {
        return null;
    }
    return mongoose.connection.db;
}

function isDBConnected() {
    return connection && mongoose.connection.readyState === 1;
}

module.exports = {
    connectDB,
    disconnectDB,
    getDB,
    isDBConnected,
    MONGODB_URI
};