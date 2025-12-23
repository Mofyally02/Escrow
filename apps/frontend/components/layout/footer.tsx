'use client';

import Link from 'next/link';
import { useCurrentLegalDocuments } from '@/lib/hooks/useLegalDocuments';
import { Shield, Loader2 } from 'lucide-react';
import { DOCUMENT_TYPE_LABELS, DocumentType } from '@/types/legal';

const LEGAL_DOCUMENT_ORDER: DocumentType[] = [
  'terms_of_service',
  'privacy_policy',
  'seller_agreement',
  'buyer_agreement',
  'disclaimer',
  'faq',
];

export function Footer() {
  const { data: documents, isLoading } = useCurrentLegalDocuments();

  const legalLinks = documents
    ?.filter((doc) => LEGAL_DOCUMENT_ORDER.includes(doc.document_type))
    .sort((a, b) => {
      const indexA = LEGAL_DOCUMENT_ORDER.indexOf(a.document_type);
      const indexB = LEGAL_DOCUMENT_ORDER.indexOf(b.document_type);
      return indexA - indexB;
    }) || [];

  return (
    <footer className="border-t bg-muted/30 backdrop-blur-sm mt-auto">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="space-y-4">
            <Link href="/" className="flex items-center gap-2">
              <Shield className="h-6 w-6 text-primary" />
              <span className="text-xl font-bold">ESCROW</span>
            </Link>
            <p className="text-sm text-muted-foreground">
              Secure marketplace for buying and selling freelance accounts with escrow protection.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-semibold mb-4">Quick Links</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/catalog" className="text-muted-foreground hover:text-primary transition-colors">
                  Browse Listings
                </Link>
              </li>
              <li>
                <Link href="/seller/dashboard" className="text-muted-foreground hover:text-primary transition-colors">
                  Sell Account
                </Link>
              </li>
              <li>
                <Link href="/buyer/dashboard" className="text-muted-foreground hover:text-primary transition-colors">
                  My Purchases
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal Documents */}
          <div>
            <h3 className="font-semibold mb-4">Legal & Policies</h3>
            {isLoading ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading...
              </div>
            ) : legalLinks.length > 0 ? (
              <ul className="space-y-2 text-sm">
                {legalLinks.map((doc) => (
                  <li key={doc.id}>
                    <Link
                      href={`/legal/${doc.slug}`}
                      className="text-muted-foreground hover:text-primary transition-colors"
                    >
                      {DOCUMENT_TYPE_LABELS[doc.document_type]}
                    </Link>
                  </li>
                ))}
                <li>
                  <Link
                    href="/legal"
                    className="text-muted-foreground hover:text-primary transition-colors font-medium"
                  >
                    View All →
                  </Link>
                </li>
              </ul>
            ) : (
              <ul className="space-y-2 text-sm">
                <li>
                  <Link
                    href="/legal"
                    className="text-muted-foreground hover:text-primary transition-colors"
                  >
                    Legal Documents
                  </Link>
                </li>
              </ul>
            )}
          </div>

          {/* Support */}
          <div>
            <h3 className="font-semibold mb-4">Support</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/contact" className="text-muted-foreground hover:text-primary transition-colors">
                  Contact Us
                </Link>
              </li>
              <li>
                <Link href="/faq" className="text-muted-foreground hover:text-primary transition-colors">
                  FAQ
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-8 pt-8 border-t flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <p>© {new Date().getFullYear()} Escrow. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <Link href="/legal" className="hover:text-primary transition-colors">
              Legal Hub
            </Link>
            <span>•</span>
            <Link href="/privacy" className="hover:text-primary transition-colors">
              Privacy
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

