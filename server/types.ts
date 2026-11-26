export type AppDeploymentMode = 'monorepo' | 'admin' | 'storefront';

export interface PublicRuntimeConfig {
  mode: AppDeploymentMode;
  adminPath: string;
  adminHost: string;
  firebaseProjectId: string;
  firebaseDatabaseId: string;
  firebaseAuthDomain: string;
  hasClientApiKey: boolean;
}

export interface HealthResponse {
  status: 'ok';
  service: string;
  timestamp: string;
}
