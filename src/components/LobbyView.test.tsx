import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import LobbyView from './LobbyView';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import '@testing-library/jest-dom';

// Mock mocks first
const mockUseSessionPoll = vi.fn();

vi.mock('../hooks/useSessionPoll', () => ({
    useSessionPoll: (id: string) => mockUseSessionPoll(id),
}));

vi.mock('../lib/supabaseClient', () => ({
    supabase: {
        auth: {
            getSession: vi.fn(),
        },
    },
}));

import { supabase } from '../lib/supabaseClient';

describe('LobbyView', () => {
    const mockFetch = vi.fn();
    const onClose = vi.fn();

    beforeEach(() => {
        vi.stubGlobal('fetch', mockFetch);
        vi.clearAllMocks();

        (supabase.auth.getSession as any).mockResolvedValue({
            data: { session: { access_token: 'fake-token' } },
        });

        // Default mock for useSessionPoll
        mockUseSessionPoll.mockReturnValue({
            session: { id: 'sess-1', status: 'waiting', participants: [] },
            loading: false,
            error: null,
            setSession: vi.fn(),
        });
    });

    afterEach(() => {
        vi.unstubAllGlobals();
    });

    it('renders session details correctly', () => {
        mockUseSessionPoll.mockReturnValue({
            session: { id: 'sess-1', status: 'waiting', pin: '1234' },
            loading: false,
            error: null,
        });

        render(<LobbyView sessionId="sess-1" role="teacher" onClose={onClose} />);

        expect(screen.getByText('sess-1')).toBeInTheDocument();
        expect(screen.getByText('PIN: 1234')).toBeInTheDocument();
        expect(screen.getByText('waiting')).toBeInTheDocument();
    });

    it('shows participants list', () => {
        mockUseSessionPoll.mockReturnValue({
            session: {
                id: 'sess-1',
                status: 'waiting',
                participants: [{ name: 'Alice' }, { name: 'Bob' }]
            },
            loading: false,
            error: null,
        });

        render(<LobbyView sessionId="sess-1" role="teacher" />);

        expect(screen.getByText('Alice')).toBeInTheDocument();
        expect(screen.getByText('Bob')).toBeInTheDocument();
        expect(screen.getByText('Participants (2)')).toBeInTheDocument();
    });

    it('handles start session action (teacher)', async () => {
        const setSession = vi.fn();
        mockUseSessionPoll.mockReturnValue({
            session: { id: 'sess-1', status: 'waiting' },
            loading: false,
            error: null,
            setSession,
        });

        mockFetch.mockResolvedValueOnce({
            ok: true,
            text: () => Promise.resolve(JSON.stringify({ status: 'active' })),
        });

        render(<LobbyView sessionId="sess-1" role="teacher" />);

        const startBtn = screen.getByRole('button', { name: /start session/i });
        fireEvent.click(startBtn);

        expect(screen.getByRole('button', { name: /start session/i })).toBeDisabled();

        await waitFor(() => {
            expect(mockFetch).toHaveBeenCalledWith(
                expect.stringContaining('/api/sessions/sess-1/start'),
                expect.objectContaining({ method: 'POST' })
            );
        });

        expect(setSession).toHaveBeenCalledWith({ status: 'active' });
    });

    it('handles end session action (teacher)', async () => {
        const setSession = vi.fn();
        mockUseSessionPoll.mockReturnValue({
            session: { id: 'sess-1', status: 'active' },
            loading: false,
            error: null,
            setSession,
        });

        // status check + end session
        mockFetch.mockImplementation(async (url) => {
            if (url.includes('/end')) {
                return {
                    ok: true,
                    text: () => Promise.resolve(JSON.stringify({ status: 'ended' })),
                };
            }
            if (url.includes('/status')) {
                return {
                    ok: true,
                    text: () => Promise.resolve(JSON.stringify({ status: 'active', id: 'sess-1' })),
                };
            }
            return { ok: true, text: () => Promise.resolve('{}') };
        });

        render(<LobbyView sessionId="sess-1" role="teacher" />);

        const endBtn = await screen.findByRole('button', { name: /end session/i });
        fireEvent.click(endBtn);

        await waitFor(() => {
            expect(mockFetch).toHaveBeenCalledWith(
                expect.stringContaining('/api/sessions/sess-1/end'),
                expect.objectContaining({ method: 'POST' })
            );
        });

        expect(setSession).toHaveBeenCalledWith({ status: 'ended' });
    });

    it('does not show controls for student', () => {
        mockUseSessionPoll.mockReturnValue({
            session: { id: 'sess-1', status: 'waiting' },
            loading: false,
            error: null,
        });

        render(<LobbyView sessionId="sess-1" role="student" onClose={onClose} />);

        expect(screen.queryByRole('button', { name: /start session/i })).not.toBeInTheDocument();
        expect(screen.queryByRole('button', { name: /end session/i })).not.toBeInTheDocument();
        expect(screen.getByRole('button', { name: /close/i })).toBeInTheDocument();
    });
});
