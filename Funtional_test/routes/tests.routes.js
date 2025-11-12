import { runProjectsE2E } from '../projects.test.js';
import { runTasksE2E } from '../tasks.test.js';

export function registerFunctionalTestRoutes(app) {
  app.post('/functional-tests/projects', async (req, res) => {
    try {
      const result = await runProjectsE2E();
      res.status(result.success ? 200 : 500).json(result);
    } catch (e) {
      res.status(500).json({ success: false, error: e?.message || String(e) });
    }
  });

  app.post('/functional-tests/tasks', async (req, res) => {
    try {
      const result = await runTasksE2E();
      res.status(result.success ? 200 : 500).json(result);
    } catch (e) {
      res.status(500).json({ success: false, error: e?.message || String(e) });
    }
  });
}

export default registerFunctionalTestRoutes;