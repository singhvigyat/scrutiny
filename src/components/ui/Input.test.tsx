import { render, screen, fireEvent } from '@testing-library/react';
import { Input } from './Input';
import { describe, it, expect, vi } from 'vitest';
import '@testing-library/jest-dom';

describe('Input', () => {
    it('renders correctly', () => {
        render(<Input placeholder="Enter text" />);
        expect(screen.getByPlaceholderText('Enter text')).toBeInTheDocument();
    });

    it('renders label when provided', () => {
        render(<Input label="Username" />);
        expect(screen.getByLabelText('Username')).toBeInTheDocument();
        expect(screen.getByText('Username')).toBeInTheDocument();
    });

    it('displays error message', () => {
        render(<Input error="Invalid input" />);
        expect(screen.getByText('Invalid input')).toBeInTheDocument();
        expect(screen.getByRole('textbox')).toHaveClass('border-red-500');
    });

    it('handles onChange events', () => {
        const handleChange = vi.fn();
        render(<Input onChange={handleChange} />);
        const input = screen.getByRole('textbox');
        fireEvent.change(input, { target: { value: 'test' } });
        expect(handleChange).toHaveBeenCalledTimes(1);
        expect(input).toHaveValue('test');
    });

    it('is disabled when disabled prop is true', () => {
        render(<Input disabled />);
        expect(screen.getByRole('textbox')).toBeDisabled();
    });
});
