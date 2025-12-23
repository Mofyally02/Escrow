'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { MarkdownEditor } from './markdown-editor';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2, Save, Sparkles } from 'lucide-react';
import { DocumentType, DOCUMENT_TYPE_LABELS } from '@/types/legal';
import { useState } from 'react';

const legalDocumentSchema = z.object({
  title: z.string().min(1, 'Title is required').max(255, 'Title too long'),
  document_type: z.enum([
    'terms_of_service',
    'privacy_policy',
    'seller_agreement',
    'buyer_agreement',
    'disclaimer',
    'faq',
    'other',
  ]),
  content_markdown: z.string().min(1, 'Content is required'),
  version: z.string().min(1, 'Version is required'),
});

type LegalDocumentFormData = z.infer<typeof legalDocumentSchema>;

interface LegalDocumentFormProps {
  initialData?: {
    title?: string;
    document_type?: DocumentType;
    content_markdown?: string;
    version?: string;
  };
  onSubmit: (data: LegalDocumentFormData) => Promise<void>;
  onCancel?: () => void;
  isLoading?: boolean;
}

export function LegalDocumentForm({
  initialData,
  onSubmit,
  onCancel,
  isLoading = false,
}: LegalDocumentFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
  } = useForm<LegalDocumentFormData>({
    resolver: zodResolver(legalDocumentSchema),
    defaultValues: {
      title: initialData?.title || '',
      document_type: initialData?.document_type || 'terms_of_service',
      content_markdown: initialData?.content_markdown || '',
      version: initialData?.version || '1.0',
    },
  });

  const contentMarkdown = watch('content_markdown');
  const documentType = watch('document_type');

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col h-full">
      <div className="flex-1 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b bg-gradient-to-r from-primary/5 to-primary/10">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-lg bg-primary/10">
              <Sparkles className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">Legal Document Editor</h2>
              <p className="text-sm text-muted-foreground">
                Create or edit legal documents with markdown support
              </p>
            </div>
          </div>

          {/* Form Fields */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                {...register('title')}
                placeholder="e.g., Terms of Service"
                className={errors.title ? 'border-destructive' : ''}
              />
              {errors.title && (
                <p className="text-sm text-destructive">{errors.title.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="document_type">Document Type</Label>
              <Select
                value={documentType}
                onValueChange={(value) => setValue('document_type', value as DocumentType)}
              >
                <SelectTrigger id="document_type" className={errors.document_type ? 'border-destructive' : ''}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(DOCUMENT_TYPE_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.document_type && (
                <p className="text-sm text-destructive">{errors.document_type.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="version">Version</Label>
              <Input
                id="version"
                {...register('version')}
                placeholder="e.g., 1.0"
                className={errors.version ? 'border-destructive' : ''}
              />
              {errors.version && (
                <p className="text-sm text-destructive">{errors.version.message}</p>
              )}
            </div>
          </div>
        </div>

        {/* Markdown Editor */}
        <div className="flex-1 min-h-0">
          <MarkdownEditor
            value={contentMarkdown}
            onChange={(value) => setValue('content_markdown', value)}
            placeholder="Start writing your legal document in markdown..."
            className="h-full"
          />
        </div>
      </div>

      {/* Footer Actions */}
      <div className="p-6 border-t bg-muted/30 flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          {contentMarkdown.length} characters
        </div>
        <div className="flex items-center gap-3">
          {onCancel && (
            <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
              Cancel
            </Button>
          )}
          <Button type="submit" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save Document
              </>
            )}
          </Button>
        </div>
      </div>
    </form>
  );
}

