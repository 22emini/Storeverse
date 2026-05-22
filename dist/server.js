"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const dbConnect_1 = require("./config/dbConnect");
const AuthRoute_1 = __importDefault(require("./routes/AuthRoute"));
const storeRoute_1 = __importDefault(require("./routes/storeRoute"));
// Load environment variables
dotenv_1.default.config();
// Connect and verify database
(0, dbConnect_1.dbConnect)();
const app = (0, express_1.default)();
const PORT = process.env.PORT || 5000;
const API = process.env.API;
// Middleware
app.use((0, cors_1.default)());
app.use(express_1.default.json());
app.use(express_1.default.static('public'));
// Basic Route
app.get('/', (req, res) => {
    res.json({ message: 'Welcome to Storeverse API!' });
});
// Database version test route
// app.get('/db-version', requestHandler);
app.use(`/api/auth`, AuthRoute_1.default);
app.use(`/api/store`, storeRoute_1.default);
// Error Handling Middleware for JSON parsing errors
app.use((err, req, res, next) => {
    if (err instanceof SyntaxError && 'status' in err && err.status === 400 && 'body' in err) {
        console.error(`Bad JSON Request: ${err.message}`);
        return res.status(400).json({
            error: 'Bad Request',
            message: 'Invalid JSON format. Please verify your request payload syntax.'
        });
    }
    next(err);
});
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
