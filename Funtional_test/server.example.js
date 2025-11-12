// ... existing code ...
import express from 'express';
import registerFunctionalTestRoutes from './routes/tests.routes.js';

const app = express();
registerFunctionalTestRoutes(app);
app.listen(4000, () => console.log('Functional Test API en http://localhost:4000'));
// ... existing code ...