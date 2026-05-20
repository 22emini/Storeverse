import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { dbConnect } from './config/dbConnect';
import AuthRoute from "./routes/AuthRoute"

// Load environment variables
dotenv.config();

// Connect and verify database
dbConnect();

const app = express();
const PORT = process.env.PORT || 5000;
const API = process.env.API;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Basic Route
app.get('/', (req: Request, res: Response) => {
  res.json({ message: 'Welcome to Storeverse API!' });
});

// Database version test route
// app.get('/db-version', requestHandler);

app.use(`/api/auth`, AuthRoute);

// Error Handling Middleware for JSON parsing errors
app.use((err: any, req: Request, res: Response, next: NextFunction): any => {
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
