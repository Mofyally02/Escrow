import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Shield, Lock, CheckCircle, ArrowRight } from 'lucide-react';
import { Navbar } from '@/components/layout/navbar';

export default function HomePage() {
  return (
    <>
      <Navbar />
      <div className="flex flex-col">
      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 text-center">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-5xl font-bold tracking-tight mb-6">
            Buy & Sell Freelance Accounts
            <span className="text-primary block mt-2">
              With Escrow Protection
            </span>
          </h1>
          <p className="text-xl text-muted-foreground mb-8">
            The safest marketplace for established Upwork, Fiverr, and
            freelance accounts. Admin-verified listings, encrypted credentials,
            and escrow-protected transactions.
          </p>
          <div className="flex gap-4 justify-center">
            <Button size="lg" asChild>
              <Link href="/catalog">
                Browse Listings
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/register">Sell Your Account</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Trust Badges */}
      <section className="bg-muted/50 py-16">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
                <Shield className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">
                Admin Verified
              </h3>
              <p className="text-muted-foreground">
                Every listing is manually reviewed by our team before approval
              </p>
            </div>

            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
                <Lock className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">
                Encrypted Credentials
              </h3>
              <p className="text-muted-foreground">
                Your account details are encrypted with military-grade security
              </p>
            </div>

            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
                <CheckCircle className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">
                Escrow Protected
              </h3>
              <p className="text-muted-foreground">
                Funds held securely until you confirm successful account access
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">
            Popular Account Categories
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { name: 'Upwork', description: 'Top-rated Upwork profiles' },
              { name: 'Fiverr', description: 'Established Fiverr seller accounts' },
              { name: 'Academic Writing', description: 'Verified academic writing panels' },
            ].map((category) => (
              <div
                key={category.name}
                className="border rounded-lg p-6 hover:border-primary transition-colors"
              >
                <h3 className="text-xl font-semibold mb-2">{category.name}</h3>
                <p className="text-muted-foreground">{category.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-primary text-primary-foreground py-20">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Get Started?</h2>
          <p className="text-xl mb-8 opacity-90">
            Join thousands of freelancers buying and selling accounts safely
          </p>
          <Button size="lg" variant="secondary" asChild>
            <Link href="/register">
              Create Your Account
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </section>
    </div>
    </>
  );
}
