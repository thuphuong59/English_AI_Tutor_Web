interface AdminUserDetail {
    user_id: string;
    email: string;
    role: 'admin' | 'user'; 
    status: 'active' | 'blocked';
    created_at: string;
    last_login_at?: string;
    session_count: number;
}