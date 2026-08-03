import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import apiRoutes from './routes/api';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const app = express();
app.use(cors());
app.use(express.json());

const port = process.env.PORT || 3001;

app.use('/api', apiRoutes);

app.listen(port, () => {
  console.log(`Backend running on port ${port}`);
});

export default app;
