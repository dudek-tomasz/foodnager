import { http, HttpResponse } from 'msw';

/**
 * MSW handlers for mocking API requests
 * Add your API endpoint mocks here
 */
export const handlers = [
  // Example: Mock a products endpoint
  http.get('/api/products', () => {
    return HttpResponse.json([
      { id: 1, name: 'Test Product 1' },
      { id: 2, name: 'Test Product 2' },
    ]);
  }),

  // Example: Mock a recipes endpoint
  http.get('/api/recipes', () => {
    return HttpResponse.json([
      { 
        id: 1, 
        title: 'Test Recipe',
        difficulty: 'easy',
        cooking_time: 30,
      },
    ]);
  }),
];

