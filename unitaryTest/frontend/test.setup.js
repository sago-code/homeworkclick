// JSDOM + mocks útiles para las pruebas
globalThis.alert = (msg) => { /* silenciar alerts en tests */ };

import { vi } from 'vitest';

// Mock simple de axios a nivel global (los tests pueden ajustar por-spec)
vi.mock('axios', () => {
  return {
    default: {
      get: vi.fn(),
      post: vi.fn(),
      put: vi.fn(),
    }
  }
});