
import React from 'react';
import AdminLayout from '../../../../admin-dashboard/components/AdminLayout';
import UserDetailView from '../../../../admin-dashboard/components/UserDetailView';

// 1. Cập nhật Interface: params bây giờ là Promise
interface PageProps {
    params: Promise<{
        id: string;
    }>;
}

// 2. Thêm từ khóa 'async' vào function component
const UserDetailPage = async ({ params }: PageProps) => {
    
    // 3. Await params để lấy dữ liệu thực tế
    const resolvedParams = await params;
    
    return (
        <AdminLayout>
            {/* Sử dụng resolvedParams.id thay vì params.id */}
            <UserDetailView userId={resolvedParams.id} />
        </AdminLayout>
    );
};

export default UserDetailPage;