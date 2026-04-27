import cookieParser from 'cookie-parser';
import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import pinoHttp from 'pino-http';
import { env } from './config';
import { loadAdminSession, requireCsrf, requireSecureTransport } from './middleware/auth';
import { errorHandler, notFoundHandler } from './middleware/error-handler';
import { attachRequestContext } from './middleware/request-context';
import { logger } from './logger';
import { adminRouter } from './routes/admin';
import { publicRouter } from './routes/public';

export const createApp = () => {
  const app = express();
  app.disable('x-powered-by');
  app.set('trust proxy', env.TRUST_PROXY);

  app.use(
    pinoHttp({
      logger,
      customProps: (request) => ({ requestId: (request as express.Request).requestId }),
    })
  );
  app.use(attachRequestContext);
  app.use(
    cors({
      origin: (origin, callback) => {
        if (!origin || origin === env.FRONTEND_ORIGIN) {
          callback(null, true);
          return;
        }
        callback(new Error('CORS origin rejected'));
      },
      credentials: true,
      methods: ['GET', 'HEAD', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'x-csrf-token', 'x-request-id', 'x-admin-device-id'],
    })
  );
  app.use(
    helmet({
      crossOriginResourcePolicy: false,
      hsts: env.NODE_ENV === 'production' ? undefined : false,
      noSniff: true,
      originAgentCluster: true,
      frameguard: { action: 'deny' },
      referrerPolicy: { policy: 'no-referrer' },
      permittedCrossDomainPolicies: { permittedPolicies: 'none' },
      xDnsPrefetchControl: { allow: false },
      ieNoOpen: true,
      contentSecurityPolicy: false,
    })
  );
  app.use((request, response, next) => {
    if (request.path.startsWith('/api/')) {
      response.setHeader('Vary', 'Origin, Cookie');
    }
    if (request.path.startsWith('/api/admin/') || request.path === '/api/admin/session') {
      response.setHeader('Cache-Control', 'no-store, private, max-age=0');
      response.setHeader('Pragma', 'no-cache');
    }
    next();
  });
  app.use(express.json({ limit: '100kb' }));
  app.use(cookieParser());
  app.use('/uploads', express.static(env.MEDIA_UPLOAD_DIR, { maxAge: '7d', immutable: false }));
  app.use(requireSecureTransport);
  app.use(loadAdminSession);
  app.use(requireCsrf);
  app.use(publicRouter);
  app.use(adminRouter);
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
};
