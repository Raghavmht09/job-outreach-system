import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check route
app.get('/health', (req, res) => {
  res.json({ success: true, message: 'Backend API is running' });
});

// API routes will be added here
// app.use('/api/jobs', jobRoutes);
// app.use('/api/contacts', contactRoutes);
// app.use('/api/messages', messageRoutes);
// app.use('/api/outreach', outreachRoutes);

app.listen(PORT, () => {
  console.log(`🚀 Backend server running on http://localhost:${PORT}`);
});

