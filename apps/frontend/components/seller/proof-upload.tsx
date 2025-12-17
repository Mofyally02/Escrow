'use client';

'use client';

import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, X, Image as ImageIcon, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ProofType } from '@/types/listing';
import { cn } from '@/lib/utils';

export interface ProofFile {
  file: File;
  preview?: string;
  proof_type: ProofType;
  description?: string;
}

interface ProofUploadProps {
  files: ProofFile[];
  onFilesChange: (files: ProofFile[]) => void;
  onUpload: (file: ProofFile) => Promise<void>;
  maxFiles?: number;
  maxSizeMB?: number;
  isLoading?: boolean;
}

const PROOF_TYPES: Array<{ value: ProofType; label: string }> = [
  { value: 'earnings', label: 'Earnings' },
  { value: 'profile', label: 'Profile' },
  { value: 'reviews', label: 'Reviews' },
  { value: 'other', label: 'Other' },
];

export function ProofUpload({
  files,
  onFilesChange,
  onUpload,
  maxFiles = 10,
  maxSizeMB = 10,
  isLoading,
}: ProofUploadProps) {
  const [uploadingIndex, setUploadingIndex] = useState<number | null>(null);

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      const newFiles: ProofFile[] = acceptedFiles.map((file) => ({
        file,
        proof_type: 'earnings',
        preview: file.type.startsWith('image/')
          ? URL.createObjectURL(file)
          : undefined,
      }));

      if (files.length + newFiles.length > maxFiles) {
        alert(`Maximum ${maxFiles} files allowed`);
        return;
      }

      onFilesChange([...files, ...newFiles]);
    },
    [files, maxFiles, onFilesChange]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.webp'],
      'application/pdf': ['.pdf'],
    },
    maxSize: maxSizeMB * 1024 * 1024,
    disabled: isLoading || files.length >= maxFiles,
  });

  const removeFile = (index: number) => {
    const newFiles = files.filter((_, i) => i !== index);
    onFilesChange(newFiles);
  };

  const updateFileType = (index: number, proof_type: ProofType) => {
    const newFiles = [...files];
    newFiles[index].proof_type = proof_type;
    onFilesChange(newFiles);
  };

  const updateFileDescription = (index: number, description: string) => {
    const newFiles = [...files];
    newFiles[index].description = description;
    onFilesChange(newFiles);
  };

  const handleUpload = async (index: number) => {
    setUploadingIndex(index);
    try {
      await onUpload(files[index]);
      // Remove from local files after successful upload
      removeFile(index);
    } catch (error) {
      console.error('Upload failed:', error);
    } finally {
      setUploadingIndex(null);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  return (
    <div className="space-y-6">
      {/* Dropzone */}
      <div
        {...getRootProps()}
        className={cn(
          'border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors',
          isDragActive
            ? 'border-primary bg-primary/5'
            : 'border-muted-foreground/25 hover:border-primary/50',
          (isLoading || files.length >= maxFiles) && 'opacity-50 cursor-not-allowed'
        )}
      >
        <input {...getInputProps()} />
        <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
        <p className="text-sm font-medium mb-1">
          {isDragActive
            ? 'Drop files here'
            : 'Drag & drop files here, or click to select'}
        </p>
        <p className="text-xs text-muted-foreground">
          Images or PDFs up to {maxSizeMB}MB. Max {maxFiles} files.
        </p>
      </div>

      {/* File List */}
      {files.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-sm font-medium">
            Uploaded Files ({files.length}/{maxFiles})
          </h3>
          {files.map((proofFile, index) => (
            <div
              key={index}
              className="border rounded-lg p-4 space-y-3"
            >
              <div className="flex items-start gap-4">
                {/* Preview */}
                {proofFile.preview ? (
                  <div className="w-20 h-20 rounded border overflow-hidden flex-shrink-0">
                    <img
                      src={proofFile.preview}
                      alt={proofFile.file.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="w-20 h-20 rounded border flex items-center justify-center flex-shrink-0">
                    <FileText className="h-8 w-8 text-muted-foreground" />
                  </div>
                )}

                {/* File Info */}
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">
                    {proofFile.file.name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatFileSize(proofFile.file.size)}
                  </p>

                  {/* Proof Type Select */}
                  <div className="mt-2">
                    <label className="text-xs font-medium mb-1 block">
                      Proof Type
                    </label>
                    <select
                      value={proofFile.proof_type}
                      onChange={(e) =>
                        updateFileType(index, e.target.value as ProofType)
                      }
                      className="w-full px-2 py-1 text-xs border rounded focus:outline-none focus:ring-1 focus:ring-primary"
                    >
                      {PROOF_TYPES.map((type) => (
                        <option key={type.value} value={type.value}>
                          {type.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Description */}
                  <div className="mt-2">
                    <label className="text-xs font-medium mb-1 block">
                      Description (optional)
                    </label>
                    <input
                      type="text"
                      value={proofFile.description || ''}
                      onChange={(e) =>
                        updateFileDescription(index, e.target.value)
                      }
                      placeholder="e.g., June 2024 earnings report"
                      className="w-full px-2 py-1 text-xs border rounded focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-col gap-2">
                  <Button
                    size="sm"
                    onClick={() => handleUpload(index)}
                    disabled={uploadingIndex === index || isLoading}
                  >
                    {uploadingIndex === index ? 'Uploading...' : 'Upload'}
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => removeFile(index)}
                    disabled={uploadingIndex === index}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

