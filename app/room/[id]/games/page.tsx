import { redirect } from 'next/navigation';

export default async function GamesPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  redirect(`/room/${encodeURIComponent(id)}#games`);
}
