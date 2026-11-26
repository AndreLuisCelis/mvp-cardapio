import express from 'express';
import fs from 'node:fs';
import path from 'node:path';
import type { Request, Response, NextFunction } from 'express';
import type { AppDeploymentMode, HealthResponse, PublicRuntimeConfig } from './types.ts';

function readFirebaseAppletJson(): Record<string, string> {
  try {
    const configPath = path.resolve(process.cwd(), 'firebase-applet-config.json');
    if (fs.existsSync(configPath)) {
      const raw = fs.readFileSync(configPath, 'utf-8');
      return JSON.parse(raw) as Record<string, string>;
    }
  } catch {
    // Fallback to environment variables
  }
  return {};
}

export function createServerApp() {
  const app = express();

  app.disable('x-powered-by');
  app.use(express.json({ limit: '2mb' }));

  app.use((_req: Request, res: Response, next: NextFunction) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    next();
  });

  app.get('/api/health', (_req: Request, res: Response<HealthResponse>) => {
    res.json({
      status: 'ok',
      service: 'cardapio-admin-monorepo',
      timestamp: new Date().toISOString(),
    });
  });

  app.get('/api/public/config', (_req: Request, res: Response<PublicRuntimeConfig>) => {
    const appletConfig = readFirebaseAppletJson();
    const rawMode = (process.env.VITE_APP_MODE || 'monorepo').trim();
    const mode: AppDeploymentMode =
      rawMode === 'admin' || rawMode === 'storefront' ? rawMode : 'monorepo';

    const apiKey = (
      process.env.VITE_FIREBASE_API_KEY ||
      appletConfig.apiKey ||
      ''
    ).trim();

    res.json({
      mode,
      adminPath: '/admin',
      adminHost: (process.env.VITE_ADMIN_HOST || '').trim(),
      firebaseProjectId:
        process.env.VITE_FIREBASE_PROJECT_ID || appletConfig.projectId || '',
      firebaseDatabaseId:
        process.env.VITE_FIREBASE_DATABASE_ID || appletConfig.firestoreDatabaseId || '',
      firebaseAuthDomain:
        process.env.VITE_FIREBASE_AUTH_DOMAIN || appletConfig.authDomain || '',
      hasClientApiKey: apiKey.length > 0,
    });
  });

  app.all('/api/{*splat}', (_req: Request, res: Response) => {
    res.status(404).json({ error: 'Rota da API não encontrada.' });
  });

  return app;
}
