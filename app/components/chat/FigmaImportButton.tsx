import React, { useState } from 'react';
import type { Message } from 'ai';
import { toast } from 'react-toastify';
import { Button } from '~/components/ui/Button';
import { classNames } from '~/utils/classNames';
import { LoadingOverlay } from '~/components/ui/LoadingOverlay';

interface FigmaImportButtonProps {
  className?: string;
  importChat?: (description: string, messages: Message[]) => Promise<void>;
}

interface FigmaImportDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (figmaUrl: string) => void;
  onFileImport: (jsonData: any) => void;
  loading: boolean;
}

function FigmaImportDialog({ isOpen, onClose, onImport, onFileImport, loading }: FigmaImportDialogProps) {
  const [figmaUrl, setFigmaUrl] = useState('');
  const [activeTab, setActiveTab] = useState<'url' | 'file'>('url');
  const [jsonFile, setJsonFile] = useState<File | null>(null);

  const handleUrlSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (figmaUrl.trim()) {
      onImport(figmaUrl.trim());
      setFigmaUrl('');
    }
  };

  const handleFileSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (jsonFile) {
      const reader = new FileReader();

      reader.onload = (e) => {
        try {
          const jsonData = JSON.parse(e.target?.result as string);
          onFileImport(jsonData);
          setJsonFile(null);
        } catch {
          toast.error('Invalid JSON file. Please check the file format.');
        }
      };
      reader.onerror = () => toast.error('Failed to read the file');
      reader.readAsText(jsonFile);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];

    if (file) {
      if (file.type === 'application/json' || file.name.endsWith('.json')) {
        setJsonFile(file);
      } else {
        toast.error('Please select a JSON file');
        e.target.value = '';
      }
    }
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-bolt-elements-background-depth-1 p-6 rounded-lg shadow-lg w-full max-w-md mx-4">
        <h2 className="text-xl font-semibold text-bolt-elements-textPrimary mb-4">Import from Figma</h2>

        {/* Tab Navigation */}
        <div className="flex border-b border-bolt-elements-borderColor mb-4">
          <button
            type="button"
            onClick={() => setActiveTab('url')}
            className={classNames(
              'px-4 py-2 text-sm font-medium border-b-2 transition-colors',
              activeTab === 'url'
                ? 'border-bolt-elements-focus text-bolt-elements-focus'
                : 'border-transparent text-bolt-elements-textSecondary hover:text-bolt-elements-textPrimary',
            )}
            disabled={loading}
          >
            Figma URL
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('file')}
            className={classNames(
              'px-4 py-2 text-sm font-medium border-b-2 transition-colors',
              activeTab === 'file'
                ? 'border-bolt-elements-focus text-bolt-elements-focus'
                : 'border-transparent text-bolt-elements-textSecondary hover:text-bolt-elements-textPrimary',
            )}
            disabled={loading}
          >
            JSON File
          </button>
        </div>

        {/* URL Tab Content */}
        {activeTab === 'url' && (
          <form onSubmit={handleUrlSubmit}>
            <div className="mb-4">
              <label htmlFor="figma-url" className="block text-sm font-medium text-bolt-elements-textPrimary mb-2">
                Figma Frame URL
              </label>
              <input
                id="figma-url"
                type="url"
                value={figmaUrl}
                onChange={(e) => setFigmaUrl(e.target.value)}
                placeholder="https://www.figma.com/design/..."
                className="w-full px-3 py-2 border border-bolt-elements-borderColor rounded-md bg-bolt-elements-background-depth-2 text-bolt-elements-textPrimary focus:outline-none focus:ring-2 focus:ring-bolt-elements-focus"
                disabled={loading}
                required
              />
              <p className="text-xs text-bolt-elements-textSecondary mt-1">
                Paste the Figma frame URL - will analyze the design and create a project that matches it exactly
              </p>
            </div>
            <div className="flex gap-2 justify-end">
              <Button type="button" onClick={onClose} variant="secondary" size="sm" disabled={loading}>
                Cancel
              </Button>
              <Button type="submit" variant="default" size="sm" disabled={loading || !figmaUrl.trim()}>
                {loading ? 'Analyzing...' : 'Create Project'}
              </Button>
            </div>
          </form>
        )}

        {/* File Upload Tab Content */}
        {activeTab === 'file' && (
          <form onSubmit={handleFileSubmit}>
            <div className="mb-4">
              <label htmlFor="figma-json" className="block text-sm font-medium text-bolt-elements-textPrimary mb-2">
                Figma Design JSON File
              </label>
              <input
                id="figma-json"
                type="file"
                accept=".json,application/json"
                onChange={handleFileChange}
                className="w-full px-3 py-2 border border-bolt-elements-borderColor rounded-md bg-bolt-elements-background-depth-2 text-bolt-elements-textPrimary focus:outline-none focus:ring-2 focus:ring-bolt-elements-focus"
                disabled={loading}
                required
              />
              {jsonFile && (
                <p className="text-sm text-bolt-elements-textSecondary mt-1">
                  Selected: {jsonFile.name} ({Math.round(jsonFile.size / 1024)}KB)
                </p>
              )}
              <p className="text-xs text-bolt-elements-textSecondary mt-1">
                Upload a JSON file containing Figma design data extracted from your design tool
              </p>
            </div>
            <div className="flex gap-2 justify-end">
              <Button type="button" onClick={onClose} variant="secondary" size="sm" disabled={loading}>
                Cancel
              </Button>
              <Button type="submit" variant="default" size="sm" disabled={loading || !jsonFile}>
                {loading ? 'Processing...' : 'Create Project'}
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

export const FigmaImportButton: React.FC<FigmaImportButtonProps> = ({ className, importChat }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const handleFigmaImport = async (figmaUrl: string) => {
    if (!importChat) {
      toast.error('Import function not available');
      return;
    }

    setIsLoading(true);

    try {
      // Extract file key and node ID from Figma URL
      const urlMatch = figmaUrl.match(/figma\.com\/(design|file)\/([a-zA-Z0-9]+)/);
      const nodeMatch = figmaUrl.match(/node-id=([^&]+)/);

      if (!urlMatch) {
        throw new Error('Invalid Figma URL format');
      }

      const fileKey = urlMatch[2];
      const nodeId = nodeMatch ? decodeURIComponent(nodeMatch[1]) : null;

      // Call the API to process the Figma frame
      const response = await fetch('/api/figma-import', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fileKey,
          nodeId,
          figmaUrl,
        }),
      });

      if (!response.ok) {
        const errorData = (await response.json().catch(() => ({}))) as { error?: string };
        throw new Error(errorData.error || `Failed to import from Figma: ${response.statusText}`);
      }

      const responseData = (await response.json()) as {
        type: string;
        prompt?: string;
        figmaData?: any;
        metadata: {
          name?: string;
          frameName?: string;
        };
      };

      // Check if we got Figma import data
      if (responseData.type === 'figma_import' && responseData.prompt && responseData.figmaData) {
        const chatTitle = responseData.metadata.frameName
          ? `Figma: ${responseData.metadata.frameName}`
          : `Figma Import: ${responseData.metadata.name || 'Unnamed Frame'}`;

        /*
         * Store both the user prompt and Figma data for attachment-based workflow.
         * This allows the user to see and edit the prompt while keeping detailed
         * Figma data available as an attachment.
         */

        // Store Figma data separately for the AI system to access
        sessionStorage.setItem('figmaDesignData', JSON.stringify(responseData.figmaData));

        // Create a clean user message with just the prompt
        const userMessage: Message = {
          id: `figma-import-${Date.now()}`,
          role: 'user',
          content: responseData.prompt,
        };

        // Import chat with the clean message
        await importChat(chatTitle, [userMessage]);
      } else {
        throw new Error('Unexpected response format from Figma import API');
      }

      setIsDialogOpen(false);
      toast.success('Figma design analyzed! Creating project based on the design.');
    } catch (error) {
      console.error('Error importing from Figma:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to import from Figma');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileImport = async (jsonData: any) => {
    if (!importChat) {
      toast.error('Import function not available');
      return;
    }

    setIsLoading(true);

    try {
      // Validate the JSON structure - check if it looks like Figma data
      if (!jsonData || typeof jsonData !== 'object') {
        throw new Error('Invalid JSON file structure');
      }

      // Create a simple prompt for the user message
      const frameName = jsonData.name || 'Design Import';
      const dimensions = jsonData.absoluteBoundingBox
        ? ` (${jsonData.absoluteBoundingBox.width}x${jsonData.absoluteBoundingBox.height}px)`
        : '';

      // Include the JSON content directly in the prompt
      const jsonString = JSON.stringify(jsonData, null, 2);

      const prompt = `Please analyze the following Figma design JSON data and create a React web application that replicates the exact design, layout, styling, and interactions using React, TypeScript, and Tailwind CSS.

Design: "${frameName}"${dimensions}

Here is the complete Figma design JSON data:

\`\`\`json
${jsonString}
\`\`\`

Please refer to this JSON data for all design details including:
- Layout and positioning (absoluteBoundingBox coordinates)
- Colors and styling (fills, strokes, effects)
- Typography and fonts (style properties)
- Interactive elements (reactions, interactions)
- Component hierarchy (children structure)
- Exact measurements and spacing

Create a React application that matches this design exactly.`;

      // Create user message with JSON content embedded in text
      const userMessage: Message = {
        id: `figma-json-import-${Date.now()}`,
        role: 'user',
        content: prompt,
      };

      // Import chat with the message containing the embedded JSON
      const chatTitle = `Figma: ${frameName}`;
      await importChat(chatTitle, [userMessage]);

      setIsDialogOpen(false);
      toast.success('Figma design data imported! The AI can now analyze your complete design.');
    } catch (error) {
      console.error('Error processing JSON file:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to process JSON file');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Button
        onClick={() => setIsDialogOpen(true)}
        title="Import from Figma"
        variant="default"
        size="lg"
        className={classNames(
          'gap-2 bg-bolt-elements-background-depth-1',
          'text-bolt-elements-textPrimary',
          'hover:bg-bolt-elements-background-depth-2',
          'border border-bolt-elements-borderColor',
          'h-10 px-4 py-2 min-w-[120px] justify-center',
          'transition-all duration-200 ease-in-out',
          className,
        )}
        disabled={isLoading}
      >
        <span className="i-ph:figma-logo w-4 h-4" />
        {isLoading ? 'Processing...' : 'Import from Figma'}
      </Button>

      <FigmaImportDialog
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        onImport={handleFigmaImport}
        onFileImport={handleFileImport}
        loading={isLoading}
      />

      {isLoading && <LoadingOverlay message="Processing design data and preparing project..." />}
    </>
  );
};
