'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { SubmissionWizard } from '@/components/seller/submission-wizard';
import { AccountDetailsForm, AccountDetailsFormData } from '@/components/seller/account-details-form';
import { CredentialForm, CredentialFormData } from '@/components/seller/credential-form';
import { ProofUpload, ProofFile } from '@/components/seller/proof-upload';
import { LegalAgreementCheckbox } from '@/components/legal/legal-agreement-checkbox';
import { useUploadProof } from '@/lib/hooks/useSellerListings';
import { 
  useAutoSaveDraft, 
  useRestoreDraft, 
  useSubmitDraft, 
  useDeleteDraft,
  DraftData 
} from '@/lib/hooks/useListingDraft';
import { Button } from '@/components/ui/button';
import { LoadingButton } from '@/components/ui/loading-button';
import { InteractiveButton } from '@/components/ui/interactive-button';
import { Shield, CheckCircle2, ArrowRight, Save, Trash2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

const STEPS = [
  { id: 'details', label: 'Account Details', description: 'Basic information' },
  { id: 'credentials', label: 'Credentials', description: 'Secure encryption' },
  { id: 'proofs', label: 'Proof Files', description: 'Upload evidence' },
  { id: 'review', label: 'Review', description: 'Final check' },
];

export default function NewListingPage() {
  const router = useRouter();
  const uploadProof = useUploadProof();
  const autoSave = useAutoSaveDraft();
  const { restore, isLoading: isRestoring } = useRestoreDraft();
  const submitDraft = useSubmitDraft();
  const deleteDraft = useDeleteDraft();
  
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState<DraftData>({
    accountDetails: undefined,
    credentials: undefined,
    proofs: [],
    sellerAgreementAcknowledged: false,
  });
  const [sellerAgreementAcknowledged, setSellerAgreementAcknowledged] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [hasRestored, setHasRestored] = useState(false);
  
  // Restore draft on mount
  useEffect(() => {
    if (!hasRestored && !isRestoring) {
      const restored = restore();
      if (restored) {
        setFormData({
          accountDetails: restored.data.accountDetails,
          credentials: restored.data.credentials,
          proofs: restored.data.proofs || [],
          sellerAgreementAcknowledged: restored.data.sellerAgreementAcknowledged || false,
        });
        // Restore to the exact step they were on (e.g., step 3 = Legal Agreement)
        setCurrentStep(restored.step);
        setSellerAgreementAcknowledged(restored.data.sellerAgreementAcknowledged || false);
        setHasRestored(true);
        
        if (restored.data.accountDetails || restored.data.credentials) {
          toast.info(`Draft restored - resuming at step ${restored.step + 1}`);
        }
      } else {
        setHasRestored(true);
      }
    }
  }, [restore, isRestoring, hasRestored]);
  
  // Auto-save on form data changes AND step changes
  useEffect(() => {
    if (hasRestored) {
      setIsSaving(true);
      autoSave(
        {
          ...formData,
          sellerAgreementAcknowledged,
        },
        currentStep  // Save current step so we can restore to exact position
      );
      
      // Reset saving state after debounce period
      const timer = setTimeout(() => {
        setIsSaving(false);
        setLastSavedAt(new Date());
      }, 600);
      
      return () => clearTimeout(timer);
    }
  }, [formData, currentStep, sellerAgreementAcknowledged, autoSave, hasRestored]);
  
  // Save step to sessionStorage immediately when it changes
  useEffect(() => {
    if (hasRestored && typeof window !== 'undefined') {
      sessionStorage.setItem('listing_draft_step', currentStep.toString());
    }
  }, [currentStep, hasRestored]);
  
  // Save on page unload
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (hasRestored && (formData.accountDetails || formData.credentials)) {
        // Save to sessionStorage as fallback (including current step)
        if (typeof window !== 'undefined') {
          sessionStorage.setItem('listing_draft', JSON.stringify({
            ...formData,
            sellerAgreementAcknowledged,
          }));
          sessionStorage.setItem('listing_draft_step', currentStep.toString());
        }
      }
    };
    
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [formData, sellerAgreementAcknowledged, currentStep, hasRestored]);
  
  const handleAccountDetailsSubmit = (data: AccountDetailsFormData) => {
    setFormData((prev) => ({ ...prev, accountDetails: data }));
    setCurrentStep(1);
  };
  
  const handleCredentialsSubmit = (data: CredentialFormData) => {
    setFormData((prev) => ({ ...prev, credentials: data }));
    setCurrentStep(2);
  };
  
  const handleProofsChange = (proofs: ProofFile[]) => {
    setFormData((prev) => ({ ...prev, proofs }));
  };
  
  const handleProofUpload = async (proofFile: ProofFile): Promise<void> => {
    // Proofs will be uploaded after listing is created
    return Promise.resolve();
  };
  
  const handleSubmit = async () => {
    if (!formData.accountDetails || !formData.credentials) {
      toast.error('Please complete all required steps');
      return;
    }
    
    if (!sellerAgreementAcknowledged) {
      toast.error('Please acknowledge the Seller Agreement');
      return;
    }
    
    // Update draft with final acknowledgment status
    autoSave(
      {
        ...formData,
        sellerAgreementAcknowledged: true,
      },
      currentStep
    );
    
    // Submit draft
    submitDraft.mutate(undefined, {
      onSuccess: async (listing) => {
        // Validate response is a listing object with an id
        if (!listing || typeof listing !== 'object' || !listing.id) {
          console.error('Invalid listing response:', listing);
          toast.error('Invalid response from server. Please try again.');
          return;
        }
        
        // Ensure listing.id is a number
        const listingIdNum = typeof listing.id === 'string' ? parseInt(listing.id, 10) : Number(listing.id);
        if (isNaN(listingIdNum) || listingIdNum <= 0) {
          console.error('Invalid listing ID:', listing.id);
          toast.error('Invalid listing ID received. Please check your listings.');
          return;
        }
        
        // Upload proof files
        if (formData.proofs.length > 0) {
          for (const proofFile of formData.proofs) {
            try {
              await uploadProof.mutateAsync({
                listingId: listingIdNum,  // Use the validated number
                proofData: {
                  proof_type: proofFile.proof_type,
                  file: proofFile.file,
                  description: proofFile.description,
                },
              });
            } catch (error: any) {
              console.error('Failed to upload proof:', error);
              // Error handling is done in useUploadProof hook
            }
          }
        }
        
        // Redirect to success page with validated number
        router.push(`/seller/listings/${listingIdNum}/success`);
      },
      onError: (error: any) => {
        // Error handling is done in useSubmitDraft hook
        // But ensure we don't render error objects
        console.error('Draft submission error:', error);
      },
    });
  };
  
  const handleDiscardDraft = () => {
    if (confirm('Are you sure you want to discard this draft? All progress will be lost.')) {
      deleteDraft.mutate(undefined, {
        onSuccess: () => {
          setFormData({
            accountDetails: undefined,
            credentials: undefined,
            proofs: [],
            sellerAgreementAcknowledged: false,
          });
          setCurrentStep(0);
          setSellerAgreementAcknowledged(false);
          router.push('/seller/listings');
        },
      });
    }
  };
  
  const canProceedToReview =
    formData.accountDetails && formData.credentials;
  
  const hasDraft = formData.accountDetails || formData.credentials;
  
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">Submit New Listing</h1>
              <p className="text-muted-foreground">
                Create a new listing for your freelance account
              </p>
            </div>
            
            {/* Draft Status Indicator */}
            {hasDraft && (
              <div className="flex items-center gap-3 text-sm">
                {isSaving ? (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Saving...</span>
                  </div>
                ) : lastSavedAt ? (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Save className="h-4 w-4" />
                    <span>Saved {format(lastSavedAt, 'MMM d, h:mm a')}</span>
                  </div>
                ) : null}
                
                <InteractiveButton
                  variant="ghost"
                  size="sm"
                  onClick={handleDiscardDraft}
                  className="text-destructive hover:text-destructive"
                  immediateFeedback={true}
                  isLoading={deleteDraft.isPending}
                  loadingText="Discarding..."
                >
                  <Trash2 className="h-4 w-4 mr-1" />
                  Discard Draft
                </InteractiveButton>
              </div>
            )}
          </div>
          
          {isRestoring && !hasRestored ? (
            <div className="flex items-center justify-center py-12">
              <div className="flex items-center gap-3 text-muted-foreground">
                <Loader2 className="h-5 w-5 animate-spin" />
                <span>Restoring draft...</span>
              </div>
            </div>
          ) : (
            <>
              {/* Wizard */}
              <SubmissionWizard
                steps={STEPS}
                currentStep={currentStep}
                onStepChange={setCurrentStep}
              />
              
              {/* Step Content */}
              <div className="bg-card border rounded-lg p-6">
                {currentStep === 0 && (
                  <AccountDetailsForm
                    defaultValues={formData.accountDetails}
                    onSubmit={handleAccountDetailsSubmit}
                    isLoading={submitDraft.isPending}
                  />
                )}
                
                {currentStep === 1 && (
                  <CredentialForm
                    defaultValues={formData.credentials}
                    onSubmit={handleCredentialsSubmit}
                    onBack={() => setCurrentStep(0)}
                    isLoading={submitDraft.isPending}
                  />
                )}
                
                {currentStep === 2 && (
                  <div className="space-y-6">
                    <div>
                      <h2 className="text-xl font-semibold mb-2">Upload Proof Files</h2>
                      <p className="text-sm text-muted-foreground mb-4">
                        Upload screenshots or documents that prove your account
                        ownership, earnings, and ratings.
                      </p>
                    </div>
                    <ProofUpload
                      files={formData.proofs}
                      onFilesChange={handleProofsChange}
                      onUpload={handleProofUpload}
                      maxFiles={10}
                      maxSizeMB={10}
                    />
                    <div className="flex justify-between pt-4">
                      <Button variant="outline" onClick={() => setCurrentStep(1)}>
                        Back
                      </Button>
                      <InteractiveButton
                        onClick={() => setCurrentStep(3)}
                        disabled={!canProceedToReview}
                        immediateFeedback={true}
                      >
                        Continue to Review
                        <ArrowRight className="h-4 w-4 ml-2" />
                      </InteractiveButton>
                    </div>
                  </div>
                )}
                
                {currentStep === 3 && (
                  <div className="space-y-6">
                    <div>
                      <h2 className="text-xl font-semibold mb-4">Review Your Listing</h2>
                      <p className="text-sm text-muted-foreground mb-6">
                        Please review all information before submitting. Once
                        submitted, your listing will be reviewed by our admin team.
                      </p>
                    </div>
                    
                    {/* Account Details Review */}
                    {formData.accountDetails && (
                      <div className="border rounded-lg p-4 space-y-3">
                        <h3 className="font-semibold">Account Details</h3>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="text-muted-foreground">Title:</span>
                            <p className="font-medium">{formData.accountDetails.title}</p>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Category:</span>
                            <p className="font-medium">{formData.accountDetails.category}</p>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Platform:</span>
                            <p className="font-medium">{formData.accountDetails.platform}</p>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Price:</span>
                            <p className="font-medium">
                              ${((formData.accountDetails.price_usd || 0) / 100).toLocaleString('en-US', {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              })}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {/* Security Notice */}
                    <div className="bg-primary/10 border border-primary/20 rounded-lg p-4">
                      <div className="flex items-start gap-3">
                        <Shield className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                        <div className="text-sm">
                          <p className="font-medium mb-1">Security Guarantee</p>
                          <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-2">
                            <li>Your credentials are encrypted with AES-256-GCM</li>
                            <li>Admins verify ownership without seeing passwords</li>
                            <li>Credentials revealed only once after full escrow</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                    
                    {/* Proof Files Count */}
                    <div className="border rounded-lg p-4">
                      <h3 className="font-semibold mb-2">Proof Files</h3>
                      <p className="text-sm text-muted-foreground">
                        {formData.proofs.length} file(s) ready to upload
                      </p>
                    </div>
                    
                    {/* Seller Agreement */}
                    <div className="border rounded-lg p-4">
                      <h3 className="font-semibold mb-4">Legal Agreement</h3>
                      <LegalAgreementCheckbox
                        documentType="seller_agreement"
                        required
                        requireSignature={true}
                        onAcknowledged={() => {
                          setSellerAgreementAcknowledged(true);
                        }}
                      />
                    </div>
                    
                    {/* Submit Button */}
                    <div className="flex justify-between pt-4">
                      <Button variant="outline" onClick={() => setCurrentStep(2)}>
                        Back
                      </Button>
                      <LoadingButton
                        onClick={handleSubmit}
                        isLoading={submitDraft.isPending}
                        loadingText="Submitting for Review..."
                        disabled={!canProceedToReview || !sellerAgreementAcknowledged}
                        size="lg"
                        className="ml-auto"
                      >
                        <CheckCircle2 className="h-4 w-4 mr-2" />
                        Submit for Review
                      </LoadingButton>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
