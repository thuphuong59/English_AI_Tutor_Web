import AdminLayout from '../../../../admin-dashboard/components/AdminLayout';
import SessionTranscriptView from '../../../../admin-dashboard/components/SessionTranscriptView';

export default function SessionPage({ params }: { params: { id: string } }) {
    return (
        <AdminLayout>
            <SessionTranscriptView sessionId={params.id} />
        </AdminLayout>
    );
}