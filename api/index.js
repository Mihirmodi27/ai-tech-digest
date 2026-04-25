import express from 'express';
import cors from 'cors';
import digestRoutes from '../server/routes/digest.js';
import categoryRoutes from '../server/routes/categories.js';
import adminRoutes from '../server/routes/admin.js';

const app = express();
app.use(cors());
app.use(express.json());

app.use('/api/digest', digestRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/admin', adminRoutes);
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

export default app;
