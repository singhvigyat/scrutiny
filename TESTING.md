# Testing Documentation

This project uses **Vitest** as the test runner and **React Testing Library** for testing React components.

## 1. Overview

- **Runner**: [Vitest](https://vitest.dev/)
- **Component Testing**: [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/)
- **Environment**: [JSDOM](https://github.com/jsdom/jsdom) (simulated browser environment)
- **Assertions**: Vitest's built-in assertions (compatible with Jest) + [jest-dom](https://github.com/testing-library/jest-dom) matchers.

## 2. Running Tests

You can run tests using the following `npm` scripts defined in `package.json`:

- **Watch Mode** (Default):
  ```bash
  npm test
  # or
  npm run test
  ```
  Runs tests in watch mode. Reruns on file changes.

- **UI Mode**:
  ```bash
  npm run test:ui
  ```
  Opens Vitest's interactive UI in the browser to view and debug tests.

- **Single Run** (CI/CD):
  ```bash
  npm run test:run
  ```
  Runs all tests once and exits. Useful for CI/CD pipelines.

## 3. Configuration

The testing configuration is located in `vitest.config.mts`:

```typescript
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
    plugins: [react()],
    test: {
        globals: true, // properties like describe, it, expect are global
        environment: 'jsdom',
        setupFiles: './src/test/setup.ts',
        css: true, // processes CSS files
        alias: {
            '@': path.resolve(__dirname, './src'),
        },
    },
});
```

### Global Setup
The file `src/test/setup.ts` runs before each test file. It handles:
- Importing `@testing-library/jest-dom` for custom matchers (e.g., `toBeInTheDocument`).
- Cleaning up the DOM after each test (`cleanup()` available via `afterEach`).
- Mocking `window.matchMedia` (required by some UI libraries).

## 4. Writing Tests

Tests should be located alongside the component they test, typically naming them `ComponentName.test.tsx`.

### Example Test (`src/components/ui/Input.test.tsx`)

```tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { Input } from './Input';
import { describe, it, expect, vi } from 'vitest';
import '@testing-library/jest-dom'; // Optional if in setup, but good for type safety in some IDEs

describe('Input', () => {
    it('renders correctly', () => {
        render(<Input placeholder="Enter text" />);
        expect(screen.getByPlaceholderText('Enter text')).toBeInTheDocument();
    });

    it('handles onChange events', () => {
        const handleChange = vi.fn(); // Create a mock function
        render(<Input onChange={handleChange} />);
        
        const input = screen.getByRole('textbox');
        fireEvent.change(input, { target: { value: 'test' } });
        
        expect(handleChange).toHaveBeenCalledTimes(1);
        expect(input).toHaveValue('test');
    });
});
```

### Key Utilities
- `render(<Component />)`: Renders the component into the JSDOM.
- `screen`: Queries the rendered DOM (e.g., `getByText`, `getByRole`, `queryByTestId`).
- `fireEvent`: Simulates DOM events (e.g., `click`, `change`, `submit`).
- `vi`: Helper for mocking functions (`vi.fn()`), timers, modules, etc.

## 5. Mocks & Stubs

- **Functions**: Use `vi.fn()` to mock callback functions.
- **Modules**: Use `vi.mock('./path/to/module')` to mock imports.

Example of mocking a module:
```tsx
import { render } from '@testing-library/react';
import MyComponent from './MyComponent';

// Mock a child component or library
vi.mock('./ChildComponent', () => ({
  default: () => <div>Mocked Child</div>
}));

it('renders mocked child', () => {
  const { getByText } = render(<MyComponent />);
  expect(getByText('Mocked Child')).toBeInTheDocument();
});
```
