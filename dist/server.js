"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const dbConnect_1 = require("./config/dbConnect");
// Load environment variables
dotenv_1.default.config();
// Verify database connection at server startup
(0, dbConnect_1.dbConnect)();
const app = (0, express_1.default)();
const PORT = process.env.PORT || 5000;
// Middleware
app.use((0, cors_1.default)());
app.use(express_1.default.json());
// Basic Routes
app.get('/', (req, res) => {
    res.json({ message: 'Welcome to Storeverse API!' });
});
app.get('/db-version', dbConnect_1.requestHandler);
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
