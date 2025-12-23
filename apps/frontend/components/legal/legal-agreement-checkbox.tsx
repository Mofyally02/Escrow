'use client';

import { useState, useEffect } from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useCurrentDocumentByType, useAcknowledgmentStatus, useAcknowledgeDocument } from '@/lib/hooks/useLegalDocuments';
import { DocumentType, DOCUMENT_TYPE_LABELS } from '@/types/legal';
import { FileText, ExternalLink, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { format } from 'date-fns';
import { useAuth } from '@/hooks/useAuth';

interface LegalAgreementCheckboxProps {
  documentType: DocumentType;
  required?: boolean;
  onAcknowledged?: () => void;
  className?: string;
  requireSignature?: boolean;  // Require full legal name signature
}

export function LegalAgreementCheckbox({
  documentType,
  required = true,
  onAcknowledged,
  className,
  requireSignature = false,
}: LegalAgreementCheckboxProps) {
  const [checked, setChecked] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [signatureName, setSignatureName] = useState('');
  const [showSignatureInput, setShowSignatureInput] = useState(false);
  const { data: document, isLoading } = useCurrentDocumentByType(documentType);
  const { data: status } = useAcknowledgmentStatus(documentType);
  const acknowledgeMutation = useAcknowledgeDocument();
  
  // Get user's full name for validation (using existing auth hook)
  const { user } = useAuth();

  useEffect(() => {
    // Auto-check if already acknowledged
    if (status?.has_acknowledged) {
      setChecked(true);
      onAcknowledged?.();
    }
  }, [status, onAcknowledged]);

  const handleCheck = async (isChecked: boolean) => {
    if (isChecked && requireSignature && !signatureName.trim()) {
      // Show signature input
      setShowSignatureInput(true);
      return;
    }
    
    setChecked(isChecked);
    
    if (isChecked && document && !status?.has_acknowledged) {
      try {
        // Validate signature if required
        if (requireSignature && !signatureName.trim()) {
          throw new Error('Full legal name is required for signature');
        }
        
        // Validate signature matches user profile
        const userFullName = (user?.full_name || '').trim();
        if (requireSignature && userFullName && signatureName.trim().toLowerCase() !== userFullName.toLowerCase()) {
          throw new Error(`Signature name must match your registered full name: ${userFullName}`);
        }
        
        await acknowledgeMutation.mutateAsync({ 
          document_id: document.id,
          signed_by_name: requireSignature ? signatureName.trim() : (user?.full_name || '')
        });
        setShowSignatureInput(false);
        onAcknowledged?.();
      } catch (error: any) {
        setChecked(false);
        
        // Handle authentication errors
        if (error?.response?.status === 401) {
          // Token expired or invalid - redirect to login
          if (typeof window !== 'undefined') {
            localStorage.removeItem('access_token');
            localStorage.removeItem('refresh_token');
            window.location.href = '/login?redirect=' + encodeURIComponent(window.location.pathname);
            return;
          }
        }
        
        alert(error?.response?.data?.detail || error?.message || 'Failed to acknowledge agreement');
      }
    } else if (isChecked && status?.has_acknowledged) {
      onAcknowledged?.();
    } else if (!isChecked) {
      setShowSignatureInput(false);
      setSignatureName('');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        Loading agreement...
      </div>
    );
  }

  if (!document) {
    return null;
  }

  return (
    <>
      <div className={className}>
        <div className="flex items-start gap-3 p-4 bg-muted/30 rounded-lg border">
          <Checkbox
            id={`agreement-${documentType}`}
            checked={checked}
            onCheckedChange={handleCheck}
            className="mt-1"
            disabled={acknowledgeMutation.isPending}
          />
          <div className="flex-1 space-y-2">
            <Label
              htmlFor={`agreement-${documentType}`}
              className="text-sm leading-relaxed cursor-pointer"
            >
              I have read and agree to the{' '}
              <button
                type="button"
                onClick={() => setShowPreview(true)}
                className="text-primary hover:underline font-medium"
              >
                {DOCUMENT_TYPE_LABELS[documentType]} (Version {document.version})
              </button>
              {required && <span className="text-destructive ml-1">*</span>}
            </Label>
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                <FileText className="h-3 w-3" />
                <span>Effective {format(new Date(document.effective_date), 'MMM d, yyyy')}</span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="h-auto p-0 text-xs h-5"
                asChild
              >
                <Link href={`/legal/${document.slug}`} target="_blank">
                  View Full Document
                  <ExternalLink className="h-3 w-3 ml-1" />
                </Link>
              </Button>
            </div>
            
            {/* Signature Input (for seller agreement) */}
            {requireSignature && showSignatureInput && (
              <div className="mt-4 p-4 bg-background border rounded-lg space-y-3">
                <Label htmlFor={`signature-${documentType}`} className="text-sm font-medium">
                  Digital Signature (Full Legal Name) *
                </Label>
                <Input
                  id={`signature-${documentType}`}
                  type="text"
                  placeholder={user?.full_name || "Enter your full legal name"}
                  value={signatureName}
                  onChange={(e) => setSignatureName(e.target.value)}
                  className="w-full"
                />
                <p className="text-xs text-muted-foreground">
                  By typing your full legal name, you are providing a legally binding digital signature.
                  {user?.full_name && (
                    <span className="block mt-1">
                      Your registered name: <strong>{user.full_name}</strong>
                    </span>
                  )}
                </p>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={() => {
                      if (signatureName.trim()) {
                        handleCheck(true);
                      }
                    }}
                    disabled={!signatureName.trim() || acknowledgeMutation.isPending}
                  >
                    {acknowledgeMutation.isPending ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Signing...
                      </>
                    ) : (
                      'Sign & Acknowledge'
                    )}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setShowSignatureInput(false);
                      setSignatureName('');
                      setChecked(false);
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Preview Modal */}
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>{document.title}</DialogTitle>
          </DialogHeader>
          <div className="bg-muted/50 rounded-lg p-4 mb-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">
                Version {document.version} • Effective{' '}
                {format(new Date(document.effective_date), 'MMMM d, yyyy')}
              </span>
              <Button variant="outline" size="sm" asChild>
                <Link href={`/legal/${document.slug}`} target="_blank">
                  View Full Document
                  <ExternalLink className="h-3 w-3 ml-1" />
                </Link>
              </Button>
            </div>
          </div>
          <ScrollArea className="flex-1 min-h-[300px] max-h-[500px] border rounded-lg p-6">
            <div
              className="prose prose-sm dark:prose-invert max-w-none"
              dangerouslySetInnerHTML={{ __html: document.content_html }}
            />
          </ScrollArea>
          <div className="flex items-center justify-end gap-3 pt-4 border-t">
            <Button variant="outline" onClick={() => setShowPreview(false)}>
              Close
            </Button>
            <Button
              onClick={() => {
                handleCheck(true);
                setShowPreview(false);
              }}
              disabled={acknowledgeMutation.isPending}
            >
              {acknowledgeMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                'I Agree'
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

