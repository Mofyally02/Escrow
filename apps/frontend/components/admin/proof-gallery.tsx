'use client';

import { useState } from 'react';
import { Image as ImageIcon, X, ZoomIn } from 'lucide-react';
import { ListingProof } from '@/types/listing';
import { Button } from '@/components/ui/button';

interface ProofGalleryProps {
  proofs: ListingProof[];
  className?: string;
}

export function ProofGallery({ proofs, className }: ProofGalleryProps) {
  const [selectedProof, setSelectedProof] = useState<ListingProof | null>(null);

  if (proofs.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <ImageIcon className="h-12 w-12 mx-auto mb-2 opacity-50" />
        <p>No proof files uploaded</p>
      </div>
    );
  }

  return (
    <>
      <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 ${className}`}>
        {proofs.map((proof) => (
          <div
            key={proof.id}
            className="border rounded-lg overflow-hidden group cursor-pointer"
            onClick={() => setSelectedProof(proof)}
          >
            <div className="aspect-video bg-muted relative">
              {proof.file_url && (
                <img
                  src={proof.file_url}
                  alt={proof.description || proof.file_name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                />
              )}
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                <ZoomIn className="h-8 w-8 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </div>
            <div className="p-3">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-medium text-muted-foreground capitalize">
                  {proof.proof_type}
                </span>
              </div>
              {proof.description && (
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {proof.description}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Lightbox Modal */}
      {selectedProof && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4"
          onClick={() => setSelectedProof(null)}
        >
          <div className="relative max-w-7xl max-h-full">
            <Button
              variant="ghost"
              size="sm"
              className="absolute top-4 right-4 z-10 text-white hover:bg-white/20"
              onClick={() => setSelectedProof(null)}
            >
              <X className="h-5 w-5" />
            </Button>
            {selectedProof.file_url && (
              <img
                src={selectedProof.file_url}
                alt={selectedProof.description || selectedProof.file_name}
                className="max-w-full max-h-[90vh] object-contain"
                onClick={(e) => e.stopPropagation()}
              />
            )}
            <div className="mt-4 text-center text-white">
              <p className="font-medium">{selectedProof.file_name}</p>
              {selectedProof.description && (
                <p className="text-sm text-white/80 mt-1">
                  {selectedProof.description}
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
