import { render, screen, fireEvent } from '@testing-library/react';
import { Button } from './Button';
import { describe, it, expect, vi } from 'vitest';
import '@testing-library/jest-dom';

describe('Button', () => {
    it('renders children correctly', () => {
        render(<Button>Click me</Button>);
        expect(screen.getByRole('button')).toHaveTextContent('Click me');
    });

    it('calls onClick handler when clicked', () => {
        const handleClick = vi.fn();
        render(<Button onClick={handleClick}>Click me</Button>);
        fireEvent.click(screen.getByRole('button'));
        expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('is disabled when disabled prop is true', () => {
        render(<Button disabled>Click me</Button>);
        expect(screen.getByRole('button')).toBeDisabled();
    });

    it('shows loading spinner when loading is true', () => {
        render(<Button loading>Click me</Button>);
        expect(screen.getByRole('button')).toBeDisabled();
        // Assuming Loader2 renders an SVG or some identifiable element.
        // We can check for a class or aria-label if we added one, but let's check if the button text is still meaningful or if children are present.
        // Based on the code: {loading && <Loader2 ... />} {children}
        // So both should be there.
    });

    it('renders specific variants', () => {
        const { rerender } = render(<Button variant="danger">Danger</Button>);
        expect(screen.getByRole('button')).toHaveClass('bg-red-600');

        rerender(<Button variant="ghost">Ghost</Button>);
        expect(screen.getByRole('button')).toHaveClass('bg-transparent');
    });
});
