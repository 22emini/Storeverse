"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.requestHandler = exports.dbConnect = exports.db = exports.sql = void 0;
// this 
const dotenv_1 = __importDefault(require("dotenv"));
const neon_http_1 = require("drizzle-orm/neon-http");
const serverless_1 = require("@neondatabase/serverless");
// Load environment variables
dotenv_1.default.config();
const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
    console.error("❌ DATABASE_URL environment variable is missing!");
    process.exit(1);
}
// 1. Create the raw Neon database client
exports.sql = (0, serverless_1.neon)(databaseUrl);
// 2. Initialize Drizzle ORM
exports.db = (0, neon_http_1.drizzle)({ client: exports.sql });
// 3. Verify Database connection at startup
const dbConnect = async () => {
    try {
        // Run a simple query to verify the connection
        await (0, exports.sql) `SELECT 1`;
        console.log('⚡ Connected to Neon Database successfully using Drizzle ORM.');
    }
    catch (error) {
        console.error('❌ Failed to connect to Neon Database:', error);
        process.exit(1);
    }
};
exports.dbConnect = dbConnect;
// 4. Request handler for '/db-version' endpoint
const requestHandler = async (req, res) => {
    try {
        const result = await (0, exports.sql) `SELECT version()`;
        const dbVersion = result && result[0] ? Object.values(result[0])[0] : 'Unknown';
        res.json({
            success: true,
            message: 'Successfully connected to database!',
            version: dbVersion
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to connect to database',
            error: error.message
        });
    }
};
exports.requestHandler = requestHandler;
