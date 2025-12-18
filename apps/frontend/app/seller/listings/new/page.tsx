'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { SubmissionWizard } from '@/components/seller/submission-wizard';
import { AccountDetailsForm, AccountDetailsFormData } from '@/components/seller/account-details-form';
import { CredentialForm, CredentialFormData } from '@/components/seller/credential-form';
import { ProofUpload, ProofFile } from '@/components/seller/proof-upload';
import { useCreateListing, useUploadProof } from '@/lib/hooks/useSellerListings';
import { Button } from '@/components/ui/button';
import { Shield, CheckCircle2, ArrowRight } from 'lucide-react';
import { ListingCreate, ProofFileCreate } from '@/types/listing';
import { toast } from 'sonner';

const STEPS = [
  { id: 'details', label: 'Account Details', description: 'Basic information' },
  { id: 'credentials', label: 'Credentials', description: 'Secure encryption' },
  { id: 'proofs', label: 'Proof Files', description: 'Upload evidence' },
  { id: 'review', label: 'Review', description: 'Final check' },
];

export default function NewListingPage() {
  const router = useRouter();
  const createListing = useCreateListing();
  const uploadProof = useUploadProof();
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState<{
    accountDetails?: AccountDetailsFormData;
    credentials?: CredentialFormData;
    proofs: ProofFile[];
  }>({
    proofs: [],
  });

  // Auto-save to localStorage
  useEffect(() => {
    const saved = localStorage.getItem('listing_draft');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setFormData(parsed);
      } catch (e) {
        // Ignore parse errors
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('listing_draft', JSON.stringify(formData));
  }, [formData]);

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
    // For now, just store them locally
    return Promise.resolve();
  };

  const handleSubmit = async () => {
    if (!formData.accountDetails || !formData.credentials) {
      toast.error('Please complete all required steps');
      return;
    }

    const listingData: ListingCreate = {
      ...formData.accountDetails,
      username: formData.credentials.username,
      password: formData.credentials.password,
      recovery_email: formData.credentials.recovery_email || undefined,
      two_fa_secret: formData.credentials.two_fa_secret || undefined,
      user_password: formData.credentials.user_password,
    };

    createListing.mutate(listingData, {
      onSuccess: async (listing) => {
        // Upload proof files
        if (formData.proofs.length > 0) {
          for (const proofFile of formData.proofs) {
            try {
              await uploadProof.mutateAsync({
                listingId: listing.id,
                proofData: {
                  proof_type: proofFile.proof_type,
                  file: proofFile.file,
                  description: proofFile.description,
                },
              });
            } catch (error) {
              console.error('Failed to upload proof:', error);
            }
          }
        }

        // Clear draft
        localStorage.removeItem('listing_draft');

        // Redirect to success page
        router.push(`/seller/listings/${listing.id}/success`);
      },
    });
  };

  const canProceedToReview =
    formData.accountDetails && formData.credentials;

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Header */}
          <div>
            <h1 className="text-3xl font-bold mb-2">Submit New Listing</h1>
            <p className="text-muted-foreground">
              Create a new listing for your freelance account
            </p>
          </div>

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
                isLoading={createListing.isPending}
              />
            )}

            {currentStep === 1 && (
              <CredentialForm
                defaultValues={formData.credentials}
                onSubmit={handleCredentialsSubmit}
                onBack={() => setCurrentStep(0)}
                isLoading={createListing.isPending}
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
                  <Button
                    onClick={() => setCurrentStep(3)}
                    disabled={!canProceedToReview}
                  >
                    Continue to Review
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
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

                {/* Submit Button */}
                <div className="flex justify-between pt-4">
                  <Button variant="outline" onClick={() => setCurrentStep(2)}>
                    Back
                  </Button>
                  <Button
                    onClick={handleSubmit}
                    disabled={!canProceedToReview || createListing.isPending}
                    size="lg"
                    className="ml-auto"
                  >
                    {createListing.isPending ? (
                      'Creating Listing...'
                    ) : (
                      <>
                        <CheckCircle2 className="h-4 w-4 mr-2" />
                        Submit for Review
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

