import express from 'express';
import registerFunctionalTestRoutes from './routes/tests.routes.js';

const app = express();
app.use(express.json());

registerFunctionalTestRoutes(app);

const PORT = process.env.FUNCTIONAL_TEST_PORT || 4000;
app.listen(PORT, () => {
  console.log(`Functional Test API escuchando en http://localhost:${PORT}`);
});