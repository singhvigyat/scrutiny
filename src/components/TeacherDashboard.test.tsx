import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { TeacherDashboard } from './TeacherDashboard';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import '@testing-library/jest-dom';

// Mocks
const mockUseNavigate = vi.fn();
// We'll mock AuthProvider's context hook
const mockUseAuthContext = vi.fn();

vi.mock('react-router-dom', () => ({
    useNavigate: () => mockUseNavigate,
}));

vi.mock('../auth/AuthProvider', () => ({
    useAuthContext: () => mockUseAuthContext(),
}));

vi.mock('../lib/supabaseClient', () => ({
    supabase: {
        auth: {
            getSession: vi.fn(),
            signOut: vi.fn(),
        },
    },
}));

import { supabase } from '../lib/supabaseClient';

describe('TeacherDashboard', () => {
    const mockFetch = vi.fn();

    beforeEach(() => {
        vi.stubGlobal('fetch', mockFetch);
        vi.clearAllMocks();

        // Setup default auth context
        mockUseAuthContext.mockReturnValue({
            user: { id: 'teacher-1', email: 'teacher@test.com' },
            role: 'teacher',
            setRole: vi.fn(),
        });

        // Setup default session
        (supabase.auth.getSession as any).mockResolvedValue({
            data: { session: { access_token: 'fake-token' } },
        });

        // Default: no quizzes
        mockFetch.mockResolvedValue({
            ok: true,
            text: () => Promise.resolve(JSON.stringify([])),
        });

        // Mock prompt/confirm
        vi.stubGlobal('confirm', vi.fn(() => true));
        vi.stubGlobal('alert', vi.fn());
    });

    afterEach(() => {
        vi.unstubAllGlobals();
    });

    it('renders dashboard correctly', async () => {
        render(<TeacherDashboard />);
        expect(screen.getByText('Teacher Dashboard')).toBeInTheDocument();
        expect(screen.getByText('Create New Quiz')).toBeInTheDocument();

        await waitFor(() => {
            expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
        });
    });

    it('fetches and displays quizzes', async () => {
        const quizzes = [
            { id: 'q1', title: 'Math 101', subject: 'Math', teacherId: 'teacher-1' },
            { id: 'q2', title: 'History 202', subject: 'History', teacherId: 'teacher-1' }
        ];

        mockFetch.mockResolvedValueOnce({
            ok: true,
            text: () => Promise.resolve(JSON.stringify({ quizzes })),
        });

        render(<TeacherDashboard />);

        await waitFor(() => {
            expect(screen.getByText('Math 101')).toBeInTheDocument();
            expect(screen.getByText('History 202')).toBeInTheDocument();
        });
    });

    it('creates a new quiz', async () => {
        render(<TeacherDashboard />);

        // Fill form
        fireEvent.change(screen.getByLabelText(/Quiz Title/i), { target: { value: 'New Quiz' } });
        fireEvent.change(screen.getByLabelText(/Subject/i), { target: { value: 'General' } });
        fireEvent.change(screen.getByPlaceholderText(/Enter question text/i), { target: { value: 'What is 2+2?' } });

        // Find options - they might be tricky to select by label since they are in a loop
        // We can use placeholder
        fireEvent.change(screen.getByPlaceholderText('Option 1'), { target: { value: '3' } });
        fireEvent.change(screen.getByPlaceholderText('Option 2'), { target: { value: '4' } });

        // Mock create response
        mockFetch.mockImplementation(async (url) => {
            if (url.includes('/api/quizzes') && !url.includes('?')) {
                return {
                    ok: true,
                    text: () => Promise.resolve(JSON.stringify({ id: 'new-id' })),
                };
            }
            return {
                ok: true,
                text: () => Promise.resolve(JSON.stringify([])),
            };
        });

        const createBtn = screen.getByRole('button', { name: 'Create Quiz' });
        fireEvent.click(createBtn);

        await waitFor(() => {
            expect(screen.getByText('Quiz created successfully.')).toBeInTheDocument();
        });

        expect(mockFetch).toHaveBeenCalledWith(
            expect.stringContaining('/api/quizzes'),
            expect.objectContaining({
                method: 'POST',
                body: expect.stringContaining('New Quiz')
            })
        );
    });

    it('validates quiz form', async () => {
        render(<TeacherDashboard />);
        const createBtn = screen.getByRole('button', { name: 'Create Quiz' });
        fireEvent.click(createBtn);

        await waitFor(() => {
            expect(screen.getByText(/Title is required/i)).toBeInTheDocument();
        });
    });
});
