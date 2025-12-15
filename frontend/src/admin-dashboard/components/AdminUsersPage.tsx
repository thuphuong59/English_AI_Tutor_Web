
import React from 'react';
import AdminLayout from './AdminLayout';
import UserManagement from './UserManagement'; 

const AdminUsersPage: React.FC = () => {
    return (
        <AdminLayout>
            <UserManagement />
        </AdminLayout>
    );
};

export default AdminUsersPage;