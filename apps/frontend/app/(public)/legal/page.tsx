'use client';

import { useCurrentLegalDocuments } from '@/lib/hooks/useLegalDocuments';
import { Loader2, FileText, Shield, Lock, Handshake, AlertTriangle, HelpCircle } from 'lucide-react';
import Link from 'next/link';
import { DOCUMENT_TYPE_LABELS, DOCUMENT_TYPE_ICONS, DocumentType } from '@/types/legal';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';

const DOCUMENT_ICONS: Record<DocumentType, typeof FileText> = {
  terms_of_service: FileText,
  privacy_policy: Lock,
  seller_agreement: Handshake,
  buyer_agreement: Handshake,
  disclaimer: AlertTriangle,
  faq: HelpCircle,
  other: FileText,
};

const DOCUMENT_COLORS: Record<DocumentType, string> = {
  terms_of_service: 'from-blue-500 to-cyan-500',
  privacy_policy: 'from-purple-500 to-pink-500',
  seller_agreement: 'from-green-500 to-emerald-500',
  buyer_agreement: 'from-orange-500 to-amber-500',
  disclaimer: 'from-red-500 to-rose-500',
  faq: 'from-indigo-500 to-blue-500',
  other: 'from-gray-500 to-slate-500',
};

export default function LegalHubPage() {
  const { data: documents, isLoading } = useCurrentLegalDocuments();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <div className="container mx-auto px-4 py-16">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center justify-center p-4 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/10 mb-6">
            <Shield className="h-12 w-12 text-primary" />
          </div>
          <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
            Legal & Policies
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Review our terms, policies, and agreements. Stay informed about your rights and
            responsibilities.
          </p>
        </div>

        {/* Documents Grid */}
        {documents && documents.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {documents.map((doc) => {
              const Icon = DOCUMENT_ICONS[doc.document_type];
              const gradient = DOCUMENT_COLORS[doc.document_type];

              return (
                <Link
                  key={doc.id}
                  href={`/legal/${doc.slug}`}
                  className="group relative overflow-hidden bg-card border rounded-2xl p-8 hover:shadow-2xl hover:shadow-primary/10 transition-all duration-300 hover:-translate-y-2"
                >
                  {/* Gradient Background */}
                  <div
                    className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-300`}
                  />

                  {/* Icon */}
                  <div
                    className={`inline-flex items-center justify-center p-4 rounded-xl bg-gradient-to-br ${gradient} mb-6 text-white shadow-lg`}
                  >
                    <Icon className="h-6 w-6" />
                  </div>

                  {/* Content */}
                  <div className="relative z-10">
                    <h3 className="text-2xl font-bold mb-2 group-hover:text-primary transition-colors">
                      {doc.title}
                    </h3>
                    <p className="text-muted-foreground mb-4">
                      {DOCUMENT_TYPE_LABELS[doc.document_type]}
                    </p>

                    {/* Metadata */}
                    <div className="flex items-center justify-between pt-4 border-t">
                      <Badge variant="outline" className="font-mono">
                        v{doc.version}
                      </Badge>
                      {doc.updated_at && (
                        <span className="text-sm text-muted-foreground">
                          Updated {format(new Date(doc.updated_at), 'MMM d, yyyy')}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Hover Arrow */}
                  <div className="absolute bottom-6 right-6 opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="p-2 rounded-full bg-primary/10 group-hover:bg-primary/20">
                      <svg
                        className="w-5 h-5 text-primary"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 5l7 7-7 7"
                        />
                      </svg>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-20">
            <FileText className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2">No documents available</h3>
            <p className="text-muted-foreground">Legal documents will appear here when published.</p>
          </div>
        )}

        {/* Footer Note */}
        <div className="mt-16 text-center">
          <p className="text-sm text-muted-foreground">
            Questions about our policies?{' '}
            <Link href="/contact" className="text-primary hover:underline">
              Contact us
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

