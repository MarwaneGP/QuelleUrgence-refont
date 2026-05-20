import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Connexion',
  description: 'Espace réservé aux opérateurs et administrateurs',
};

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
