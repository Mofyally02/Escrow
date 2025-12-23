'use client';

import { useState } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Eye, Code, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface MarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export function MarkdownEditor({
  value,
  onChange,
  placeholder = 'Write your markdown here...',
  className,
}: MarkdownEditorProps) {
  const [viewMode, setViewMode] = useState<'edit' | 'preview' | 'split'>('split');

  // Simple markdown preview (for production, use react-markdown)
  const renderPreview = (markdown: string) => {
    // Basic markdown rendering
    let html = markdown
      .replace(/^# (.*$)/gim, '<h1 class="text-3xl font-bold mt-6 mb-4">$1</h1>')
      .replace(/^## (.*$)/gim, '<h2 class="text-2xl font-semibold mt-5 mb-3">$1</h2>')
      .replace(/^### (.*$)/gim, '<h3 class="text-xl font-semibold mt-4 mb-2">$1</h3>')
      .replace(/^#### (.*$)/gim, '<h4 class="text-lg font-semibold mt-3 mb-2">$1</h4>')
      .replace(/\*\*(.*?)\*\*/gim, '<strong class="font-bold">$1</strong>')
      .replace(/\*(.*?)\*/gim, '<em class="italic">$1</em>')
      .replace(/`(.*?)`/gim, '<code class="bg-muted px-1.5 py-0.5 rounded text-sm font-mono">$1</code>')
      .replace(/\[([^\]]+)\]\(([^)]+)\)/gim, '<a href="$2" class="text-primary hover:underline">$1</a>')
      .replace(/\n\n/gim, '</p><p class="mb-4">')
      .replace(/^\- (.*$)/gim, '<li class="ml-4 list-disc">$1</li>');

    // Wrap in paragraph if not already wrapped
    if (!html.startsWith('<')) {
      html = `<p class="mb-4">${html}</p>`;
    }

    return { __html: html };
  };

  return (
    <div className={cn('flex flex-col h-full', className)}>
      {/* Toolbar */}
      <div className="flex items-center justify-between p-3 border-b bg-muted/30 backdrop-blur-sm">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          <span className="text-sm font-medium">Markdown Editor</span>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant={viewMode === 'edit' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('edit')}
            className="h-8"
          >
            <Code className="h-3.5 w-3.5 mr-1.5" />
            Edit
          </Button>
          <Button
            variant={viewMode === 'split' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('split')}
            className="h-8"
          >
            Split
          </Button>
          <Button
            variant={viewMode === 'preview' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('preview')}
            className="h-8"
          >
            <Eye className="h-3.5 w-3.5 mr-1.5" />
            Preview
          </Button>
        </div>
      </div>

      {/* Editor/Preview Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Editor */}
        {(viewMode === 'edit' || viewMode === 'split') && (
          <div className={cn('flex-1 flex flex-col', viewMode === 'split' && 'border-r')}>
            <ScrollArea className="flex-1">
              <Textarea
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                className="min-h-full border-0 rounded-none font-mono text-sm resize-none focus-visible:ring-0"
                style={{ fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, "Liberation Mono", monospace' }}
              />
            </ScrollArea>
            <div className="p-2 border-t bg-muted/20 text-xs text-muted-foreground">
              {value.length} characters • {value.split('\n').length} lines
            </div>
          </div>
        )}

        {/* Preview */}
        {(viewMode === 'preview' || viewMode === 'split') && (
          <div className={cn('flex-1 flex flex-col', viewMode === 'split' && 'bg-muted/10')}>
            <ScrollArea className="flex-1 p-6">
              <div
                className="prose prose-sm max-w-none dark:prose-invert"
                dangerouslySetInnerHTML={renderPreview(value || placeholder)}
              />
            </ScrollArea>
          </div>
        )}
      </div>
    </div>
  );
}

