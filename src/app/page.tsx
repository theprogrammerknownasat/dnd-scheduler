// src/app/page.tsx
import { redirect } from 'next/navigation';

export default function Home() {
  // Redirect to login page
  redirect('/login');

  return null;
}