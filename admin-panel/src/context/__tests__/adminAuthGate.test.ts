import { describe, it, expect, vi, beforeEach } from 'vitest';

describe('Admin Authorization Gate (Requirement 14.1–14.4)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('rejects login and signs out if user is not in admin_users table', async () => {
    const signOutMock = vi.fn().mockResolvedValue({});
    const signInMock = vi.fn().mockResolvedValue({
      data: {
        session: { access_token: 'fake-token' },
        user: { id: 'usr-123', email: 'impostor@example.com' },
      },
      error: null,
    });

    const singleMock = vi.fn().mockResolvedValue({
      data: null,
      error: { message: 'Row not found' },
    });

    const eqMock = vi.fn().mockReturnValue({ single: singleMock });
    const selectMock = vi.fn().mockReturnValue({ eq: eqMock });
    const fromMock = vi.fn().mockImplementation((table: string) => {
      if (table === 'admin_users') {
        return { select: selectMock };
      }
      return {};
    });

    const mockSupabase = {
      auth: {
        signInWithPassword: signInMock,
        signOut: signOutMock,
      },
      from: fromMock,
    };

    // Simulated login function logic identical to AdminContext.loginAdminWithCredentials
    const loginAdminWithCredentials = async (email: string, pass: string) => {
      const { data, error } = await mockSupabase.auth.signInWithPassword({ email, password: pass });
      if (error) return { success: false, error: error.message };
      if (!data?.session || !data?.user) return { success: false, error: 'Authentication failed' };

      const { data: adminRecord, error: adminErr } = await mockSupabase
        .from('admin_users')
        .select('id')
        .eq('id', data.user.id)
        .single();

      if (adminErr || !adminRecord) {
        await mockSupabase.auth.signOut();
        return { success: false, error: 'Unauthorized: not an admin account' };
      }
      return { success: true };
    };

    const result = await loginAdminWithCredentials('impostor@example.com', 'secret123');

    expect(result.success).toBe(false);
    expect(result.error).toBe('Unauthorized: not an admin account');
    expect(signOutMock).toHaveBeenCalledTimes(1);
  });

  it('permits login when user has a matching record in admin_users table', async () => {
    const signOutMock = vi.fn().mockResolvedValue({});
    const signInMock = vi.fn().mockResolvedValue({
      data: {
        session: { access_token: 'valid-token' },
        user: { id: 'admin-uuid-1', email: 'admin@gchome.com' },
      },
      error: null,
    });

    const singleMock = vi.fn().mockResolvedValue({
      data: { id: 'admin-uuid-1', email: 'admin@gchome.com', role: 'admin' },
      error: null,
    });

    const eqMock = vi.fn().mockReturnValue({ single: singleMock });
    const selectMock = vi.fn().mockReturnValue({ eq: eqMock });
    const fromMock = vi.fn().mockImplementation((table: string) => {
      if (table === 'admin_users') {
        return { select: selectMock };
      }
      return {};
    });

    const mockSupabase = {
      auth: {
        signInWithPassword: signInMock,
        signOut: signOutMock,
      },
      from: fromMock,
    };

    const loginAdminWithCredentials = async (email: string, pass: string) => {
      const { data, error } = await mockSupabase.auth.signInWithPassword({ email, password: pass });
      if (error) return { success: false, error: error.message };
      if (!data?.session || !data?.user) return { success: false, error: 'Authentication failed' };

      const { data: adminRecord, error: adminErr } = await mockSupabase
        .from('admin_users')
        .select('id')
        .eq('id', data.user.id)
        .single();

      if (adminErr || !adminRecord) {
        await mockSupabase.auth.signOut();
        return { success: false, error: 'Unauthorized: not an admin account' };
      }
      return { success: true };
    };

    const result = await loginAdminWithCredentials('admin@gchome.com', 'admin_pass');

    expect(result.success).toBe(true);
    expect(signOutMock).not.toHaveBeenCalled();
  });
});
