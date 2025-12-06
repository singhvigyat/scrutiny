import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import CreateLobbyModal from './CreateLobbyModal';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import '@testing-library/jest-dom';

vi.mock('../lib/supabaseClient', () => ({
    supabase: {
        auth: {
            getSession: vi.fn(),
        },
    },
}));

import { supabase } from '../lib/supabaseClient';

describe('CreateLobbyModal', () => {
    const mockFetch = vi.fn();
    const onCreated = vi.fn();
    const onClose = vi.fn();

    beforeEach(() => {
        vi.stubGlobal('fetch', mockFetch);
        vi.clearAllMocks();
        (supabase.auth.getSession as any).mockResolvedValue({
            data: { session: { access_token: 'fake-token' } },
        });
    });

    afterEach(() => {
        vi.unstubAllGlobals();
    });

    it('renders correctly', () => {
        render(<CreateLobbyModal quizId="q1" onClose={onClose} />);
        expect(screen.getByText('Create Lobby')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Create' })).toBeInTheDocument();
    });

    it('creates lobby successfully', async () => {
        mockFetch.mockResolvedValueOnce({
            ok: true,
            text: () => Promise.resolve(JSON.stringify({ sessionId: 's1', pin: '123456' })),
        });

        render(<CreateLobbyModal quizId="q1" onCreated={onCreated} onClose={onClose} />);

        fireEvent.click(screen.getByRole('button', { name: 'Create' }));

        expect(screen.getByRole('button', { name: 'Creating...' })).toBeDisabled();

        await waitFor(() => {
            expect(onCreated).toHaveBeenCalledWith('s1', '123456');
        });

        expect(mockFetch).toHaveBeenCalledWith(
            expect.stringContaining('/api/quizzes/q1/start'),
            expect.objectContaining({
                method: 'POST',
                body: expect.stringContaining('"duration":15')
            })
        );
    });

    it('handles error during creation', async () => {
        mockFetch.mockResolvedValueOnce({
            ok: false,
            status: 500,
            text: () => Promise.resolve('Server Error'),
        });

        render(<CreateLobbyModal quizId="q1" />);

        fireEvent.click(screen.getByRole('button', { name: 'Create' }));

        await waitFor(() => {
            expect(screen.getByText('Server Error')).toBeInTheDocument();
        });

        expect(screen.getByRole('button', { name: 'Create' })).not.toBeDisabled();
    });

    it('validates duration input', async () => {
        render(<CreateLobbyModal quizId="q1" />);
        const input = screen.getByRole('spinbutton');
        fireEvent.change(input, { target: { value: '30' } });
        expect(input).toHaveValue(30);

        // Ensure fetch returns something if we click
        mockFetch.mockResolvedValueOnce({
            ok: true,
            text: () => Promise.resolve(JSON.stringify({ sessionId: 's1', pin: '123' })),
        });

        fireEvent.click(screen.getByRole('button', { name: 'Create' }));

        await waitFor(() => {
            expect(mockFetch).toHaveBeenCalled();
        });
    });
});
