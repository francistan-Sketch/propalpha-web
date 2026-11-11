import { redirect } from 'next/navigation';

// /app is the public nav's "Open PropAlpha" target; the shell lives at /dashboard.
export default function AppIndex() {
  redirect('/dashboard');
}
