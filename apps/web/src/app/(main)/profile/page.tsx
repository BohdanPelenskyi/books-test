import type { Metadata } from 'next';
import { ProfileView } from '@/features/profile/components/ProfileView';

export const metadata: Metadata = { title: 'Профіль' };

export default function ProfilePage() {
  return <ProfileView />;
}
