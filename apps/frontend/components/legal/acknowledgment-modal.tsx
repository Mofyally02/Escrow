'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useCurrentDocumentByType, useAcknowledgeDocument } from '@/lib/hooks/useLegalDocuments';
import { Loader2, FileText, AlertCircle, CheckCircle2 } from 'lucide-react';
import { DocumentType, DOCUMENT_TYPE_LABELS } from '@/types/legal';
import { format } from 'date-fns';
import Link from 'next/link';

interface AcknowledgmentModalProps {
  documentType: DocumentType;
  isOpen: boolean;
  onClose: () => void;
  onAcknowledged: () => void;
  title?: string;
  description?: string;
  required?: boolean;
}

export function AcknowledgmentModal({
  documentType,
  isOpen,
  onClose,
  onAcknowledged,
  title,
  description,
  required = true,
}: AcknowledgmentModalProps) {
  const [acknowledged, setAcknowledged] = useState(false);
  const { data: document, isLoading } = useCurrentDocumentByType(documentType);
  const acknowledgeMutation = useAcknowledgeDocument();

  useEffect(() => {
    if (!isOpen) {
      setAcknowledged(false);
    }
  }, [isOpen]);

  const handleAcknowledge = async () => {
    if (!document || !acknowledged) return;

    try {
      await acknowledgeMutation.mutateAsync({ document_id: document.id });
      onAcknowledged();
      onClose();
    } catch (error) {
      console.error('Failed to acknowledge document:', error);
    }
  };

  const displayTitle = title || `Updated ${DOCUMENT_TYPE_LABELS[documentType]}`;
  const displayDescription =
    description ||
    `Please review the updated ${DOCUMENT_TYPE_LABELS[documentType].toLowerCase()} and acknowledge that you have read and agree to it.`;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-primary/10">
              <AlertCircle className="h-5 w-5 text-primary" />
            </div>
            <div>
              <DialogTitle className="text-2xl">{displayTitle}</DialogTitle>
              <DialogDescription className="text-base mt-1">
                {displayDescription}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : document ? (
          <>
            {/* Document Info */}
            <div className="bg-muted/50 rounded-lg p-4 mb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <FileText className="h-5 w-5 text-primary" />
                  <div>
                    <p className="font-semibold">{document.title}</p>
                    <p className="text-sm text-muted-foreground">
                      Version {document.version} • Effective{' '}
                      {format(new Date(document.effective_date), 'MMMM d, yyyy')}
                    </p>
                  </div>
                </div>
                <Button variant="outline" size="sm" asChild>
                  <Link href={`/legal/${document.slug}`} target="_blank">
                    View Full Document
                  </Link>
                </Button>
              </div>
            </div>

            {/* Document Preview */}
            <ScrollArea className="flex-1 min-h-[300px] max-h-[400px] border rounded-lg p-6 mb-4">
              <div
                className="prose prose-sm dark:prose-invert max-w-none"
                dangerouslySetInnerHTML={{ __html: document.content_html }}
              />
            </ScrollArea>

            {/* Acknowledgment Checkbox */}
            <div className="flex items-start gap-3 p-4 bg-muted/30 rounded-lg border">
              <Checkbox
                id="acknowledge"
                checked={acknowledged}
                onCheckedChange={(checked) => setAcknowledged(checked === true)}
                className="mt-1"
              />
              <label
                htmlFor="acknowledge"
                className="text-sm leading-relaxed cursor-pointer flex-1"
              >
                I have read and understood the {DOCUMENT_TYPE_LABELS[documentType].toLowerCase()}{' '}
                (Version {document.version}) and agree to be bound by its terms.
                {required && <span className="text-destructive ml-1">*</span>}
              </label>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t">
              {!required && (
                <Button variant="outline" onClick={onClose}>
                  Cancel
                </Button>
              )}
              <Button
                onClick={handleAcknowledge}
                disabled={!acknowledged || acknowledgeMutation.isPending}
                className="min-w-[120px]"
              >
                {acknowledgeMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    Acknowledge
                  </>
                )}
              </Button>
            </div>
          </>
        ) : (
          <div className="text-center py-12">
            <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">Document not available</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

