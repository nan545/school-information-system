import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';

import authRouter from './server/routes/auth.routes.ts';
import studentRouter from './server/routes/student.routes.ts';
import teacherRouter from './server/routes/teacher.routes.ts';
import academicRouter from './server/routes/academic.routes.ts';
import resultsRouter from './server/routes/results.routes.ts';
import attendanceRouter from './server/routes/attendance.routes.ts';
import assignmentsRouter from './server/routes/assignments.routes.ts';
import announcementsRouter from './server/routes/announcements.routes.ts';
import financeRouter from './server/routes/finance.routes.ts';
import timetablesRouter from './server/routes/timetables.routes.ts';
import reportsRouter from './server/routes/reports.routes.ts';
import notificationsRouter from './server/routes/notifications.routes.ts';
import enrollmentsRouter from './server/routes/enrollments.routes.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
  const isProd = process.env.NODE_ENV === 'production';

  app.use(cors());
  app.use(express.json());

  // API Health Check
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'healthy',
      system: 'Apex School Information System',
      time: new Date().toISOString(),
    });
  });

  // REST API Endpoints
  app.use('/api/auth', authRouter);
  app.use('/api/students', studentRouter);
  app.use('/api/teachers', teacherRouter);
  app.use('/api/academic', academicRouter);
  app.use('/api/results', resultsRouter);
  app.use('/api/attendance', attendanceRouter);
  app.use('/api/assignments', assignmentsRouter);
  app.use('/api/announcements', announcementsRouter);
  app.use('/api/finance', financeRouter);
  app.use('/api/timetables', timetablesRouter);
  app.use('/api/reports', reportsRouter);
  app.use('/api/notifications', notificationsRouter);
  app.use('/api/enrollments', enrollmentsRouter);

  // Direct REST aliases matching user prompt requirements
  // e.g. GET /api/classes, GET /api/subjects, GET /api/payments
  app.use('/api/classes', (req, res, next) => {
    req.url = '/classes' + req.url;
    academicRouter(req, res, next);
  });
  app.use('/api/subjects', (req, res, next) => {
    req.url = '/subjects' + req.url;
    academicRouter(req, res, next);
  });
  app.use('/api/payments', (req, res, next) => {
    req.url = '/payments' + req.url;
    financeRouter(req, res, next);
  });

  // Global Error Handler for API
  app.use('/api', (err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error('Unhandled API Error:', err);
    res.status(500).json({ error: 'Internal server error occurred.' });
  });

  // Frontend Serving
  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist/index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Apex SIS Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
