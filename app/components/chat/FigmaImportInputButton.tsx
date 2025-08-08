import React, { useState } from 'react';
import { toast } from 'react-toastify';
import { IconButton } from '~/components/ui/IconButton';
import { Button } from '~/components/ui/Button';

interface FigmaImportInputButtonProps {
  onImport: (jsonData: any, purpose: 'modify-current' | 'add-new', navigationAction?: string) => void;
  disabled?: boolean;
}

interface FigmaImportDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (jsonData: any, purpose: 'modify-current' | 'add-new', navigationAction?: string) => void;
}

function FigmaImportDialog({ isOpen, onClose, onImport }: FigmaImportDialogProps) {
  const [jsonFile, setJsonFile] = useState<File | null>(null);
  const [purpose, setPurpose] = useState<'modify-current' | 'add-new'>('modify-current');
  const [navigationAction, setNavigationAction] = useState('');
  const [isLoading, setIsLoading] = useState(false);

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!jsonFile) {
      toast.error('Please select a JSON file');
      return;
    }

    if (purpose === 'add-new' && !navigationAction.trim()) {
      toast.error('Please specify the navigation action');
      return;
    }

    setIsLoading(true);

    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const jsonData = JSON.parse(e.target?.result as string);
        onImport(jsonData, purpose, purpose === 'add-new' ? navigationAction : undefined);

        // Reset form
        setJsonFile(null);
        setPurpose('modify-current');
        setNavigationAction('');
        onClose();

        toast.success(
          purpose === 'modify-current'
            ? 'Figma design imported for current page modification'
            : 'Figma design imported for new page creation',
        );
      } catch {
        toast.error('Invalid JSON file. Please check the file format.');
      } finally {
        setIsLoading(false);
      }
    };

    reader.onerror = () => {
      toast.error('Failed to read the file');
      setIsLoading(false);
    };
    reader.readAsText(jsonFile);
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-bolt-elements-background-depth-1 p-6 rounded-lg shadow-lg w-full max-w-md mx-4">
        <h2 className="text-xl font-semibold text-bolt-elements-textPrimary mb-4">Import Figma Design</h2>

        <form onSubmit={handleSubmit}>
          {/* File Upload */}
          <div className="mb-4">
            <label htmlFor="figma-json-input" className="block text-sm font-medium text-bolt-elements-textPrimary mb-2">
              Figma Design JSON File
            </label>
            <input
              id="figma-json-input"
              type="file"
              accept=".json,application/json"
              onChange={handleFileChange}
              className="w-full px-3 py-2 border border-bolt-elements-borderColor rounded-md bg-bolt-elements-background-depth-2 text-bolt-elements-textPrimary focus:outline-none focus:ring-2 focus:ring-bolt-elements-focus"
              disabled={isLoading}
              required
            />
            {jsonFile && (
              <p className="text-sm text-bolt-elements-textSecondary mt-1">
                Selected: {jsonFile.name} ({Math.round(jsonFile.size / 1024)}KB)
              </p>
            )}
          </div>

          {/* Purpose Selection */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-bolt-elements-textPrimary mb-2">Import Purpose</label>
            <div className="space-y-2">
              <label className="flex items-center">
                <input
                  type="radio"
                  name="purpose"
                  value="modify-current"
                  checked={purpose === 'modify-current'}
                  onChange={(e) => setPurpose(e.target.value as 'modify-current')}
                  className="mr-2"
                  disabled={isLoading}
                />
                <span className="text-sm text-bolt-elements-textPrimary">Modify current page design</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="purpose"
                  value="add-new"
                  checked={purpose === 'add-new'}
                  onChange={(e) => setPurpose(e.target.value as 'add-new')}
                  className="mr-2"
                  disabled={isLoading}
                />
                <span className="text-sm text-bolt-elements-textPrimary">Add new page with navigation</span>
              </label>
            </div>
          </div>

          {/* Navigation Action (only for new page) */}
          {purpose === 'add-new' && (
            <div className="mb-4">
              <label
                htmlFor="navigation-action"
                className="block text-sm font-medium text-bolt-elements-textPrimary mb-2"
              >
                Navigation Action
              </label>
              <input
                id="navigation-action"
                type="text"
                value={navigationAction}
                onChange={(e) => setNavigationAction(e.target.value)}
                placeholder="e.g., Click 'Sign Up' button, Click 'Learn More' link"
                className="w-full px-3 py-2 border border-bolt-elements-borderColor rounded-md bg-bolt-elements-background-depth-2 text-bolt-elements-textPrimary focus:outline-none focus:ring-2 focus:ring-bolt-elements-focus"
                disabled={isLoading}
                required
              />
              <p className="text-xs text-bolt-elements-textSecondary mt-1">
                Describe what action on the current page leads to this new page
              </p>
            </div>
          )}

          <div className="flex gap-2 justify-end">
            <Button type="button" onClick={onClose} variant="secondary" size="sm" disabled={isLoading}>
              Cancel
            </Button>
            <Button type="submit" variant="default" size="sm" disabled={isLoading || !jsonFile}>
              {isLoading ? 'Processing...' : 'Import Design'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

export const FigmaImportInputButton: React.FC<FigmaImportInputButtonProps> = ({ onImport, disabled }) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  return (
    <>
      <IconButton
        title="Import Figma Design"
        disabled={disabled}
        className="transition-all"
        onClick={() => setIsDialogOpen(true)}
      >
        <div className="i-ph:figma-logo text-xl"></div>
      </IconButton>

      <FigmaImportDialog isOpen={isDialogOpen} onClose={() => setIsDialogOpen(false)} onImport={onImport} />
    </>
  );
};
