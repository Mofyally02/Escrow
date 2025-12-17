'use client';

import { useEffect, useState } from 'react';
import { CheckCircle2, PartyPopper } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

interface SuccessConfettiProps {
  onClose?: () => void;
}

export function SuccessConfetti({ onClose }: SuccessConfettiProps) {
  const [showConfetti, setShowConfetti] = useState(true);

  useEffect(() => {
    // Trigger confetti animation
    const timer = setTimeout(() => {
      setShowConfetti(false);
    }, 5000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="relative bg-card border rounded-lg p-8 max-w-md mx-4 text-center animate-in zoom-in-95 duration-300">
        {/* Confetti Effect */}
        {showConfetti && (
          <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-lg">
            {[...Array(50)].map((_, i) => (
              <div
                key={i}
                className="absolute animate-confetti"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                  animationDelay: `${Math.random() * 2}s`,
                  animationDuration: `${2 + Math.random() * 2}s`,
                }}
              >
                <PartyPopper className="h-4 w-4 text-yellow-400" />
              </div>
            ))}
          </div>
        )}

        <div className="relative z-10">
          <div className="flex justify-center mb-4">
            <div className="rounded-full bg-green-100 p-4">
              <CheckCircle2 className="h-12 w-12 text-green-600" />
            </div>
          </div>

          <h2 className="text-3xl font-bold mb-2">Transaction Complete!</h2>
          <p className="text-muted-foreground mb-6">
            You now own the account. The seller has been paid and the
            transaction is complete.
          </p>

          <div className="space-y-3">
            <Button asChild className="w-full">
              <Link href="/buyer/purchases">View My Purchases</Link>
            </Button>
            <Button variant="outline" onClick={onClose} className="w-full">
              Close
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

