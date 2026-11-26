import { createRoot } from 'react-dom/client';
import { AppRouter } from './client/AppRouter';
import { ErrorBoundary } from './client/components/ErrorBoundary';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <ErrorBoundary>
    <AppRouter />
  </ErrorBoundary>
);
