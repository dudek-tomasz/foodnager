import { setupWorker } from 'msw/browser';
import { handlers } from './handlers';

/**
 * MSW worker for browser environment (used in development)
 * To enable MSW in browser, import this file in your app entry point
 */
export const worker = setupWorker(...handlers);

