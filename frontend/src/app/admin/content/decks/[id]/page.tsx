import AdminLayout from '../../../../../admin-dashboard/components/AdminLayout';
import DeckDetailView from '../../../../../admin-dashboard/components/DeckDetailView';

// Nhớ dùng async/await params cho Next.js 15
export default async function DeckDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const resolvedParams = await params;
    // Chuyển id từ string sang number để khớp với backend
    const deckId = parseInt(resolvedParams.id);

    return (
        <AdminLayout>
            <DeckDetailView deckId={deckId} />
        </AdminLayout>
    );
}