import { renderHook, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useSessionPoll } from './useSessionPoll';

// Mock supabase client
vi.mock('../lib/supabaseClient', () => ({
    supabase: {
        auth: {
            getSession: vi.fn(),
        },
    },
}));

import { supabase } from '../lib/supabaseClient';

describe('useSessionPoll', () => {
    const mockFetch = vi.fn();

    beforeEach(() => {
        vi.stubGlobal('fetch', mockFetch);
        vi.clearAllMocks();

        // Default supabase mock to return a token
        (supabase.auth.getSession as any).mockResolvedValue({
            data: { session: { access_token: 'fake-token' } },
        });
    });

    afterEach(() => {
        vi.unstubAllGlobals();
    });

    it('should not poll if sessionId is null', async () => {
        const { result } = renderHook(() => useSessionPoll(null));

        expect(result.current.loading).toBe(false);
        expect(result.current.session).toBeNull();
        expect(mockFetch).not.toHaveBeenCalled();
    });

    it('should fetch session status successfully', async () => {
        const mockSession = { id: '123', status: 'active' };
        mockFetch.mockResolvedValueOnce({
            ok: true,
            text: () => Promise.resolve(JSON.stringify({ session: mockSession })),
        });

        const { result } = renderHook(() => useSessionPoll('123'));

        // Initially loading
        expect(result.current.loading).toBe(true);

        // Wait for success
        await waitFor(() => {
            expect(result.current.session).toEqual(mockSession);
        });

        expect(result.current.loading).toBe(false);
        expect(result.current.error).toBeNull();
        expect(supabase.auth.getSession).toHaveBeenCalled();
        expect(mockFetch).toHaveBeenCalledWith(
            expect.stringContaining('/api/sessions/123/status'),
            expect.objectContaining({
                headers: expect.objectContaining({
                    Authorization: 'Bearer fake-token'
                })
            })
        );
    });

    it('should handle API errors gracefully', async () => {
        mockFetch.mockResolvedValueOnce({
            ok: false,
            status: 404,
            text: () => Promise.resolve('{"message": "Not found"}'),
        });

        const { result } = renderHook(() => useSessionPoll('999'));

        await waitFor(() => {
            expect(result.current.error).toBeTruthy();
        });

        expect(result.current.session).toBeNull();
        expect(result.current.loading).toBe(false);
    });

    it('should retry polling', async () => {
        // First attempt fails
        mockFetch.mockResolvedValueOnce({
            ok: false,
            status: 500,
            text: () => Promise.resolve('Error'),
        });
        // Second attempt succeeds
        const mockSession = { id: 'retry-success' };
        mockFetch.mockResolvedValueOnce({
            ok: true,
            text: () => Promise.resolve(JSON.stringify({ session: mockSession })),
        });

        const { result } = renderHook(() => useSessionPoll('retry-test', 50));

        // First failure
        await waitFor(() => {
            expect(result.current.error).toBeTruthy();
        });

        // Should succeed eventually (auto-retries after 50ms)
        await waitFor(() => {
            expect(result.current.session).toEqual(mockSession);
        }, { timeout: 1000 });
    });
});

