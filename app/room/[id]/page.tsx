import type { Metadata } from 'next';
import { RoomExperience } from '@/components/RoomExperience';

export const metadata: Metadata = { title: 'Your room', robots: { index: false, follow: false } };
export default async function RoomPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const roomId = /^[a-z0-9]{6}$/i.test(id) ? id.toUpperCase() : id;
  return <RoomExperience key={roomId} id={roomId} />;
}
