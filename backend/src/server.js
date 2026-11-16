import express from 'express';
import cors from 'cors';
import database from './database.js';

const app = express();
const port = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.get('/api/health', (_request, response) => {
  response.json({ status: 'ok', database: database.open ? 'connected' : 'closed' });
});

app.listen(port, () => {
  console.log(`Backend disponível em http://localhost:${port}`);
});
