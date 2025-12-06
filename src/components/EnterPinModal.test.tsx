import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import EnterPinModal from './EnterPinModal';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import '@testing-library/jest-dom';

// Mock supabase
vi.mock('../lib/supabaseClient', () => ({
    supabase: {
        auth: {
            getSession: vi.fn(),
        },
    },
}));

import { supabase } from '../lib/supabaseClient';

describe('EnterPinModal', () => {
    const mockFetch = vi.fn();
    const onClose = vi.fn();
    const onJoined = vi.fn();

    beforeEach(() => {
        vi.stubGlobal('fetch', mockFetch);
        onClose.mockClear();
        onJoined.mockClear();
        vi.clearAllMocks();

        (supabase.auth.getSession as any).mockResolvedValue({
            data: { session: { access_token: 'test-token' } },
        });
    });

    afterEach(() => {
        vi.unstubAllGlobals();
    });

    it('renders correctly when open', () => {
        render(<EnterPinModal open={true} onClose={onClose} />);
        expect(screen.getByText('Enter PIN')).toBeInTheDocument();
        expect(screen.getByPlaceholderText('e.g. 961971')).toBeInTheDocument();
    });

    it('does not render when closed', () => {
        render(<EnterPinModal open={false} onClose={onClose} />);
        expect(screen.queryByText('Enter PIN')).not.toBeInTheDocument();
    });

    it('validates empty PIN', async () => {
        render(<EnterPinModal open={true} onClose={onClose} />);

        const joinBtn = screen.getByRole('button', { name: /join session/i });
        fireEvent.click(joinBtn);

        expect(await screen.findByText('Please enter a PIN.')).toBeInTheDocument();
        expect(mockFetch).not.toHaveBeenCalled();
    });

    it('shows error if no auth token', async () => {
        (supabase.auth.getSession as any).mockResolvedValue({ data: { session: null } });

        render(<EnterPinModal open={true} onClose={onClose} />);

        const input = screen.getByPlaceholderText('e.g. 961971');
        fireEvent.change(input, { target: { value: '123456' } });

        const joinBtn = screen.getByRole('button', { name: /join session/i });
        fireEvent.click(joinBtn);

        expect(await screen.findByText('No auth token. Please sign in.')).toBeInTheDocument();
    });

    it('handles successful join', async () => {
        mockFetch.mockResolvedValueOnce({
            ok: true,
            text: () => Promise.resolve(JSON.stringify({ sessionId: 'sess-1', quizId: 'quiz-1' })),
        });

        render(<EnterPinModal open={true} onClose={onClose} onJoined={onJoined} />);

        const input = screen.getByPlaceholderText('e.g. 961971');
        fireEvent.change(input, { target: { value: '123456' } });

        fireEvent.click(screen.getByRole('button', { name: /join session/i }));

        await waitFor(() => {
            expect(screen.getByText('Joined lobby. Waiting for teacher to start the quiz.')).toBeInTheDocument();
        });

        expect(onJoined).toHaveBeenCalledWith('sess-1', 'quiz-1');
        expect(mockFetch).toHaveBeenCalledWith(
            expect.stringContaining('/api/sessions/join'),
            expect.objectContaining({
                method: 'POST',
                body: JSON.stringify({ pin: '123456' })
            })
        );
    });

    it('handles API error', async () => {
        mockFetch.mockResolvedValueOnce({
            ok: false,
            status: 400,
            text: () => Promise.resolve(JSON.stringify({ message: 'Invalid PIN' })),
        });

        render(<EnterPinModal open={true} onClose={onClose} />);

        const input = screen.getByPlaceholderText('e.g. 961971');
        fireEvent.change(input, { target: { value: '000000' } });

        fireEvent.click(screen.getByRole('button', { name: /join session/i }));

        await waitFor(() => {
            expect(screen.getByText(/Invalid PIN/)).toBeInTheDocument();
        });
    });
});
