import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import useragent from 'express-useragent';
import routes from './routes/routes';

const app = express();

app.use(cors());
app.use(bodyParser.json({ limit: '10mb' }));
app.use(useragent.express());

app.use('/api/face', routes);

export default app;   
