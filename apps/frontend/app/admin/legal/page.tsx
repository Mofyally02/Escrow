'use client';

import { useState } from 'react';
import { useLegalDocuments, useDeleteLegalDocument, usePublishLegalDocument } from '@/lib/hooks/useLegalDocuments';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { LegalDocumentForm } from '@/components/admin/legal-document-form';
import { useCreateLegalDocument, useUpdateLegalDocument } from '@/lib/hooks/useLegalDocuments';
import { Loader2, Plus, FileText, Edit, Trash2, Globe, History, Sparkles } from 'lucide-react';
import { LegalDocument, DocumentType, DOCUMENT_TYPE_LABELS, DOCUMENT_TYPE_ICONS } from '@/types/legal';
import { toast } from 'sonner';
import Link from 'next/link';
import { format } from 'date-fns';

export default function AdminLegalDocumentsPage() {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingDocument, setEditingDocument] = useState<LegalDocument | null>(null);
  const [publishingDocument, setPublishingDocument] = useState<LegalDocument | null>(null);
  const [selectedType, setSelectedType] = useState<DocumentType | 'all'>('all');

  const { data: documents, isLoading } = useLegalDocuments({
    current_only: false,
    document_type: selectedType !== 'all' ? selectedType : undefined,
  });

  const createMutation = useCreateLegalDocument();
  const updateMutation = useUpdateLegalDocument();
  const deleteMutation = useDeleteLegalDocument();
  const publishMutation = usePublishLegalDocument();

  const handleCreate = async (data: any) => {
    try {
      await createMutation.mutateAsync(data);
      toast.success('Document created successfully');
      setIsCreateModalOpen(false);
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Failed to create document');
    }
  };

  const handleUpdate = async (data: any) => {
    if (!editingDocument) return;
    try {
      await updateMutation.mutateAsync({ id: editingDocument.id, data });
      toast.success('Document updated successfully');
      setEditingDocument(null);
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Failed to update document');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this document?')) return;
    try {
      await deleteMutation.mutateAsync(id);
      toast.success('Document deleted successfully');
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Failed to delete document');
    }
  };

  const handlePublish = async () => {
    if (!publishingDocument) return;
    try {
      await publishMutation.mutateAsync({ id: publishingDocument.id });
      toast.success('Document published successfully');
      setPublishingDocument(null);
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Failed to publish document');
    }
  };

  const filteredDocuments = documents || [];

  return (
    <>
      {/* Header */}
      <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 backdrop-blur-sm">
                  <Sparkles className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h1 className="text-4xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                    Legal Documents
                  </h1>
                  <p className="text-muted-foreground mt-1">
                    Manage Terms of Service, Privacy Policy, and other legal documents
                  </p>
                </div>
              </div>
            </div>
            <Button
              onClick={() => setIsCreateModalOpen(true)}
              className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70"
            >
              <Plus className="h-4 w-4 mr-2" />
              New Document
            </Button>
          </div>

          {/* Filter Tabs */}
          <div className="flex items-center gap-2 mt-6 overflow-x-auto pb-2">
            <Button
              variant={selectedType === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedType('all')}
            >
              All
            </Button>
            {Object.entries(DOCUMENT_TYPE_LABELS).map(([type, label]) => (
              <Button
                key={type}
                variant={selectedType === type ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedType(type as DocumentType)}
              >
                {DOCUMENT_TYPE_ICONS[type as DocumentType]} {label}
              </Button>
            ))}
          </div>
        </div>

        {/* Documents Grid */}
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : filteredDocuments.length === 0 ? (
          <div className="text-center py-20">
            <FileText className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2">No documents found</h3>
            <p className="text-muted-foreground mb-4">Create your first legal document</p>
            <Button onClick={() => setIsCreateModalOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Document
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredDocuments.map((doc) => (
              <div
                key={doc.id}
                className="group relative bg-card border rounded-xl p-6 hover:shadow-2xl hover:shadow-primary/5 transition-all duration-300 hover:-translate-y-1"
              >
                {/* Current Badge */}
                {doc.is_current && (
                  <div className="absolute top-4 right-4">
                    <Badge className="bg-gradient-to-r from-green-500 to-emerald-500 text-white border-0">
                      <Globe className="h-3 w-3 mr-1" />
                      Current
                    </Badge>
                  </div>
                )}

                {/* Icon & Type */}
                <div className="flex items-start gap-4 mb-4">
                  <div className="p-3 rounded-lg bg-primary/10 text-2xl">
                    {DOCUMENT_TYPE_ICONS[doc.document_type]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-lg mb-1 truncate">{doc.title}</h3>
                    <p className="text-sm text-muted-foreground">
                      {DOCUMENT_TYPE_LABELS[doc.document_type]}
                    </p>
                  </div>
                </div>

                {/* Metadata */}
                <div className="space-y-2 mb-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Version</span>
                    <Badge variant="outline">{doc.version}</Badge>
                  </div>
                  {doc.published_at && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Published</span>
                      <span>{format(new Date(doc.published_at), 'MMM d, yyyy')}</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Updated</span>
                    <span>{format(new Date(doc.updated_at || doc.created_at), 'MMM d, yyyy')}</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 pt-4 border-t">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setEditingDocument(doc)}
                    className="flex-1"
                  >
                    <Edit className="h-3.5 w-3.5 mr-1.5" />
                    Edit
                  </Button>
                  {!doc.is_current && (
                    <Button
                      variant="default"
                      size="sm"
                      onClick={() => setPublishingDocument(doc)}
                      className="flex-1"
                    >
                      <Globe className="h-3.5 w-3.5 mr-1.5" />
                      Publish
                    </Button>
                  )}
                  {!doc.is_current && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(doc.id)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Modal */}
      <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
        <DialogContent className="max-w-6xl h-[90vh] p-0">
          <DialogHeader className="sr-only">
            <DialogTitle>Create Legal Document</DialogTitle>
            <DialogDescription>Create a new legal document</DialogDescription>
          </DialogHeader>
          <LegalDocumentForm
            onSubmit={handleCreate}
            onCancel={() => setIsCreateModalOpen(false)}
            isLoading={createMutation.isPending}
          />
        </DialogContent>
      </Dialog>

      {/* Edit Modal */}
      <Dialog open={!!editingDocument} onOpenChange={() => setEditingDocument(null)}>
        <DialogContent className="max-w-6xl h-[90vh] p-0">
          <DialogHeader className="sr-only">
            <DialogTitle>Edit Legal Document</DialogTitle>
            <DialogDescription>Edit legal document</DialogDescription>
          </DialogHeader>
          {editingDocument && (
            <LegalDocumentForm
              initialData={editingDocument}
              onSubmit={handleUpdate}
              onCancel={() => setEditingDocument(null)}
              isLoading={updateMutation.isPending}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Publish Confirmation Modal */}
      <Dialog open={!!publishingDocument} onOpenChange={() => setPublishingDocument(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Publish Document</DialogTitle>
            <DialogDescription>
              This will publish this document as the current version and unpublish the previous
              version of the same type. Are you sure?
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-center justify-end gap-3 mt-4">
            <Button variant="outline" onClick={() => setPublishingDocument(null)}>
              Cancel
            </Button>
            <Button onClick={handlePublish} disabled={publishMutation.isPending}>
              {publishMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Publishing...
                </>
              ) : (
                'Publish'
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

