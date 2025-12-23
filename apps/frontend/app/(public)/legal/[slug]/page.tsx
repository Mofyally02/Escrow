'use client';

import { useLegalDocumentBySlug } from '@/lib/hooks/useLegalDocuments';
import { useParams } from 'next/navigation';
import { Loader2, Calendar, FileText, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { useEffect, useState } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';

export default function LegalDocumentPage() {
  const params = useParams();
  const slug = params.slug as string;
  const { data: document, isLoading } = useLegalDocumentBySlug(slug);
  const [toc, setToc] = useState<Array<{ id: string; text: string; level: number }>>([]);

  useEffect(() => {
    if (document?.content_html) {
      // Parse HTML to extract headings for TOC
      const parser = new DOMParser();
      const doc = parser.parseFromString(document.content_html, 'text/html');
      const headings = doc.querySelectorAll('h1, h2, h3');
      const tocItems: Array<{ id: string; text: string; level: number }> = [];

      headings.forEach((heading, index) => {
        const id = `heading-${index}`;
        heading.id = id;
        const level = parseInt(heading.tagName.charAt(1));
        tocItems.push({
          id,
          text: heading.textContent || '',
          level,
        });
      });

      setToc(tocItems);
    }
  }, [document]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!document) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <FileText className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
          <h2 className="text-2xl font-bold mb-2">Document not found</h2>
          <p className="text-muted-foreground mb-4">The legal document you're looking for doesn't exist.</p>
          <Button asChild>
            <Link href="/legal">Back to Legal Hub</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-5xl mx-auto">
          {/* Back Button */}
          <Button variant="ghost" asChild className="mb-6">
            <Link href="/legal">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Legal Hub
            </Link>
          </Button>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-3">
              <article className="bg-card border rounded-2xl p-8 md:p-12 shadow-lg">
                {/* Header */}
                <div className="mb-8 pb-8 border-b">
                  <div className="flex items-start justify-between mb-4">
                    <h1 className="text-4xl font-bold">{document.title}</h1>
                    <Badge variant="outline" className="font-mono ml-4">
                      v{document.version}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-6 text-sm text-muted-foreground">
                    {document.effective_date && (
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        <span>
                          Effective: {format(new Date(document.effective_date), 'MMMM d, yyyy')}
                        </span>
                      </div>
                    )}
                    {document.updated_at && (
                      <div>
                        Last updated: {format(new Date(document.updated_at), 'MMMM d, yyyy')}
                      </div>
                    )}
                  </div>
                </div>

                {/* Content */}
                <div
                  className="prose prose-lg dark:prose-invert max-w-none prose-headings:font-bold prose-headings:mt-8 prose-headings:mb-4 prose-h1:text-3xl prose-h2:text-2xl prose-h3:text-xl prose-p:leading-relaxed prose-p:mb-6 prose-ul:my-6 prose-li:my-2 prose-a:text-primary prose-a:no-underline hover:prose-a:underline prose-strong:font-bold prose-code:bg-muted prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-sm"
                  dangerouslySetInnerHTML={{ __html: document.content_html }}
                />
              </article>
            </div>

            {/* Table of Contents Sidebar */}
            {toc.length > 0 && (
              <div className="lg:col-span-1">
                <div className="sticky top-8">
                  <div className="bg-card border rounded-xl p-6">
                    <h2 className="text-lg font-semibold mb-4">Table of Contents</h2>
                    <ScrollArea className="max-h-[calc(100vh-200px)]">
                      <nav className="space-y-2">
                        {toc.map((item) => (
                          <a
                            key={item.id}
                            href={`#${item.id}`}
                            className={`block text-sm hover:text-primary transition-colors ${
                              item.level === 1
                                ? 'font-semibold'
                                : item.level === 2
                                ? 'ml-4'
                                : 'ml-8 text-muted-foreground'
                            }`}
                          >
                            {item.text}
                          </a>
                        ))}
                      </nav>
                    </ScrollArea>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

