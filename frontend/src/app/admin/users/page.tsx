
import AdminLayout from '../../../admin-dashboard/components/AdminLayout'
import UserManagement from '../../../admin-dashboard/components/UserManagement'; 
import React from 'react';

const AdminUsersRoutePage: React.FC = () => {
    return (
        <AdminLayout>
            <UserManagement />
        </AdminLayout>
    );
};

export default AdminUsersRoutePage;