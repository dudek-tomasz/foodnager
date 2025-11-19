import { ReactElement } from 'react';
import { render, RenderOptions } from '@testing-library/react';

/**
 * Custom render function that wraps components with necessary providers
 * Extend this as you add more providers (e.g., ThemeProvider, QueryClientProvider)
 */
const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) => {
  return render(ui, { ...options });
};

// Re-export everything from Testing Library
export * from '@testing-library/react';
export { customRender as render };

