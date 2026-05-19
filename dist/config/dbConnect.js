"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.requestHandler = exports.dbConnect = exports.db = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
const serverless_1 = require("@neondatabase/serverless");
dotenv_1.default.config();
// Initialize the Neon database client using the connection string
exports.db = (0, serverless_1.neon)(process.env.DATABASE_URL || '');
/**
 * Helper function to verify database connectivity at server startup.
 */
const dbConnect = async () => {
    try {
        const result = await (0, exports.db) `SELECT version()`;
        const version = result[0]?.version || 'unknown version';
        console.log('🔌 Database connection verified successfully!');
        console.log(`🤖 PostgreSQL Version: ${version}`);
    }
    catch (error) {
        console.error('❌ Database connection verification failed:', error);
        process.exit(1);
    }
};
exports.dbConnect = dbConnect;
/**
 * Express-compatible route handler to fetch the database version.
 */
const requestHandler = async (req, res) => {
    try {
        const result = await (0, exports.db) `SELECT version()`;
        const version = result[0]?.version || 'unknown version';
        res.status(200).send(version);
    }
    catch (error) {
        res.status(500).json({ error: error.message || 'Database query failed' });
    }
};
exports.requestHandler = requestHandler;
