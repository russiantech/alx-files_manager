import express from 'express';
import bodyParser from 'body-parser';
import router from './routes/index';

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware to parse JSON bodies
app.use(bodyParser.json());

// Load routes
app.use('/', router);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

