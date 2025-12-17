import { Shield } from 'lucide-react';
import Link from 'next/link';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-background via-muted/20 to-background p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <Link href="/" className="flex items-center justify-center space-x-2 mb-8">
          <Shield className="h-8 w-8 text-primary" />
          <span className="text-2xl font-bold">ESCROW</span>
        </Link>
        <p className="text-center text-sm text-muted-foreground mb-8">
          Buy & Sell Freelance Accounts Safely
        </p>
        {children}
      </div>
    </div>
  );
}

