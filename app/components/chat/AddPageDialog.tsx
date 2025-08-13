import React, { useState, useMemo } from 'react';
import { Dialog, DialogRoot, DialogClose } from '~/components/ui/Dialog';
import { Dropdown, DropdownItem } from '~/components/ui/Dropdown';
import { Input } from '~/components/ui/Input';
import { Label } from '~/components/ui/Label';
import { Button } from '~/components/ui/Button';
import { IconButton } from '~/components/ui/IconButton';
import { classNames } from '~/utils/classNames';
import { useStore } from '@nanostores/react';
import { workbenchStore } from '~/lib/stores/workbench';

interface AddPageDialogProps {
  open: boolean;
  onClose: () => void;
  onAddPage: (formattedText: string) => void;
}

interface PageOption {
  id: string;
  label: string;
  description: string;
}

export const AddPageDialog: React.FC<AddPageDialogProps> = ({ open, onClose, onAddPage }) => {
  const [selectedPage, setSelectedPage] = useState<PageOption | null>(null);
  const [screenName, setScreenName] = useState('');
  const [designRequirements, setDesignRequirements] = useState('');
  const [actionToNextPage, setActionToNextPage] = useState('');
  const [screenType, setScreenType] = useState<'page' | 'modal' | 'drawer' | 'component'>('page');

  // Get current files from the workbench store
  const files = useStore(workbenchStore.files);

  // Extract pages from src/screens/pages/ directory
  const pageOptions = useMemo(() => {
    const pages: PageOption[] = [];
    const pageDirectories = new Set<string>();

    // Scan for any files/folders in src/screens/pages/ to detect page directories
    Object.entries(files).forEach(([filePath]) => {
      if (filePath.includes('/src/screens/pages/')) {
        /*
         * Extract page directory name from any file in src/screens/pages/[directory]/...
         * Handle both '/home/project/src/screens/pages/' and 'src/screens/pages/' paths
         */
        const srcIndex = filePath.indexOf('/src/screens/pages/');

        if (srcIndex !== -1) {
          const relativePath = filePath.substring(srcIndex + 1); // Remove leading slash and prefix
          const pathParts = relativePath.split('/');

          if (pathParts.length >= 4) {
            const pageDirectory = pathParts[3]; // The page directory name
            pageDirectories.add(pageDirectory);
          }
        }
      }
    });

    // Convert page directories to pageOptions
    pageDirectories.forEach((pageDirectory) => {
      // Convert kebab-case directory name to readable label
      const pageLabel = pageDirectory
        .split('-')
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');

      pages.push({
        id: pageDirectory,
        label: pageLabel,
        description: `src/screens/pages/${pageDirectory}/`,
      });
    });

    return pages;
  }, [files]);

  const isNewChat = pageOptions.length === 0;
  const dialogTitle = isNewChat ? 'Create a New Screen' : 'Add Another Screen';
  const submitButtonText = isNewChat ? 'Create Screen' : 'Add Screen';

  const generateScreenId = (name: string): string => {
    return name
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '');
  };

  const handleSubmit = () => {
    if (!screenName || !designRequirements) {
      return;
    }

    const screenId = generateScreenId(screenName);
    const navigationTrigger = selectedPage ? actionToNextPage : undefined;
    const parentScreen = selectedPage?.id;

    let formattedText;

    if (isNewChat || !selectedPage) {
      // Template for new standalone screen creation
      formattedText = `Create a new interactive${screenType} called "${screenName}" using the modular screen architecture.
Use react framework and strictly create the page based on the DESIGN REQUIREMENTS so it looks and interact exactly like DESIGN REQUIREMENTS.
SCREEN CONFIGURATION:
- Screen Name: ${screenName}
- Screen Type: ${screenType}
- Screen ID: ${screenId}
- Architecture: Self-contained, minimal dependencies

DESIGN REQUIREMENTS:
${designRequirements}

IMPLEMENTATION INSTRUCTIONS:
Use the screen-based architecture for maximum modularity and minimal ripple effects. The screen should be completely self-contained with its own folder structure and dependencies.

<boltArtifact id="create-${screenId}" title="Create ${screenName} ${screenType}" type="bundled">
<boltAction type="screen" screenId="${screenId}" screenName="${screenName}" screenType="${screenType}"${parentScreen ? ` parentScreen="${parentScreen}"` : ''}${navigationTrigger ? ` navigationTrigger="${navigationTrigger}"` : ''}>
</boltAction>

${
  selectedPage && actionToNextPage
    ? `<boltAction type="navigation" fromScreen="${selectedPage.id}" toScreen="${screenId}" trigger="${actionToNextPage}" navigationType="${screenType === 'modal' ? 'modal' : screenType === 'drawer' ? 'drawer' : 'push'}">
</boltAction>

`
    : ''
}<!-- Generate appropriate files based on the design requirements -->
</boltArtifact>

IMPORTANT: 
- Follow the modular folder structure: src/screens/${screenType}s/${screenId}/
- Create self-contained components with minimal external dependencies
- Use proper TypeScript interfaces and props
- Include responsive design and accessibility features
- Generate any necessary shared components in src/components/shared/
- Ensure the screen can interact with other screens through well-defined interfaces`;
    } else {
      // Template for adding screen with navigation from existing page
      formattedText = `Create a new interactive${screenType} called "${screenName}" that users will navigate to when ${actionToNextPage} on ${selectedPage!.label}.
Use react framework and strictly create the page based on the DESIGN REQUIREMENTS so it looks and interact exactly like DESIGN REQUIREMENTS.
SCREEN CONFIGURATION:
- Screen Name: ${screenName}
- Screen Type: ${screenType}
- Screen ID: ${screenId}
- Parent Screen: ${selectedPage!.label}
- Navigation Trigger: ${actionToNextPage}
- Architecture: Self-contained with parent-child relationship

DESIGN REQUIREMENTS:
${designRequirements}

IMPLEMENTATION INSTRUCTIONS:
Create this screen using the modular architecture with minimal impact on existing functionality. The screen should integrate seamlessly with the existing ${selectedPage!.label} screen.

<boltArtifact id="add-${screenId}" title="Add ${screenName} ${screenType}" type="bundled">
<boltAction type="screen" screenId="${screenId}" screenName="${screenName}" screenType="${screenType}" parentScreen="${selectedPage!.id}" navigationTrigger="${actionToNextPage}">
</boltAction>

<boltAction type="navigation" fromScreen="${selectedPage!.id}" toScreen="${screenId}" trigger="${actionToNextPage}" navigationType="${screenType === 'modal' ? 'modal' : screenType === 'drawer' ? 'drawer' : 'push'}">
</boltAction>

<!-- Generate appropriate files based on the design requirements -->
</boltArtifact>

IMPORTANT:
- Only modify ${selectedPage!.label} to add navigation to the new screen
- Follow the modular folder structure: src/screens/${screenType}s/${screenId}/
- Ensure the new screen can receive data from and send data back to ${selectedPage!.label}
- Create proper interfaces for screen communication
- Maintain architectural consistency with existing screens
- Make no other changes to existing functionality`;
    }

    onAddPage(formattedText);
    handleClose();
  };

  const handleClose = () => {
    setSelectedPage(null);
    setScreenName('');
    setDesignRequirements('');
    setActionToNextPage('');
    setScreenType('page');
    onClose();
  };

  const isFormValid =
    screenName.trim() && designRequirements.trim() && (isNewChat || !selectedPage || actionToNextPage.trim());

  return (
    <DialogRoot open={open} onOpenChange={handleClose}>
      <Dialog showCloseButton={false} onClose={handleClose}>
        <div className="p-6 bg-bolt-elements-background-depth-1 max-w-3xl w-full max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-bolt-elements-textPrimary">{dialogTitle}</h2>
            <DialogClose asChild>
              <IconButton
                icon="i-ph:x"
                className="text-bolt-elements-textTertiary hover:text-bolt-elements-textSecondary"
                onClick={handleClose}
              />
            </DialogClose>
          </div>

          <div className="space-y-6">
            {/* Screen Name */}
            <div className="space-y-2">
              <Label htmlFor="screen-name">Screen Name</Label>
              <Input
                id="screen-name"
                className="bg-white text-gray-900 placeholder:text-gray-500"
                placeholder="e.g., User Profile, Product Dashboard, Settings Panel"
                value={screenName}
                onChange={(e) => setScreenName(e.target.value)}
              />
            </div>

            {/* Screen Type */}
            <div className="space-y-2">
              <Label htmlFor="screen-type">Screen Type</Label>
              <Dropdown
                trigger={
                  <Button variant="outline" className="w-full justify-between text-left" id="screen-type">
                    <span className="capitalize">{screenType}</span>
                    <div className="i-ph:caret-down text-lg" />
                  </Button>
                }
                align="start"
              >
                {(['page', 'modal', 'drawer', 'component'] as const).map((type) => (
                  <DropdownItem
                    key={type}
                    onSelect={() => setScreenType(type)}
                    className={classNames(screenType === type ? 'bg-bolt-elements-background-depth-3' : '')}
                  >
                    <div className="flex flex-col">
                      <span className="capitalize font-medium">{type}</span>
                      <span className="text-xs text-bolt-elements-textTertiary">
                        {type === 'page' && 'Full screen page with routing'}
                        {type === 'modal' && 'Overlay dialog or popup'}
                        {type === 'drawer' && 'Side panel or sliding content'}
                        {type === 'component' && 'Reusable UI component'}
                      </span>
                    </div>
                  </DropdownItem>
                ))}
              </Dropdown>
            </div>

            {/* Parent Screen Selection - Only show for existing projects */}
            {!isNewChat && (
              <div className="space-y-2">
                <Label htmlFor="parent-screen">Parent Screen (Optional)</Label>
                <select
                  id="parent-screen"
                  className="w-full px-3 py-2 border border-bolt-elements-borderColor rounded-md bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-bolt-elements-ring"
                  value={selectedPage?.id || ''}
                  onChange={(e) => {
                    const page = pageOptions.find((p) => p.id === e.target.value);
                    setSelectedPage(page || null);
                  }}
                >
                  <option value="">No parent (standalone screen)</option>
                  {pageOptions.map((page) => (
                    <option key={page.id} value={page.id}>
                      {page.label}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Navigation Trigger - Only show when parent screen is selected */}
            {selectedPage && (
              <div className="space-y-2">
                <Label htmlFor="navigation-trigger">Navigation Trigger</Label>
                <Input
                  id="navigation-trigger"
                  className="bg-white text-gray-900 placeholder:text-gray-500"
                  placeholder="e.g., clicking 'View Profile' button, submitting the form, tapping the menu item"
                  value={actionToNextPage}
                  onChange={(e) => setActionToNextPage(e.target.value)}
                />
              </div>
            )}

            {/* Design Requirements */}
            <div className="space-y-2">
              <Label htmlFor="design-requirements">Design & Functionality Description</Label>
              <textarea
                id="design-requirements"
                className={classNames(
                  'w-full min-h-[150px] p-3 rounded-md border border-bolt-elements-borderColor',
                  'bg-white text-gray-900',
                  'placeholder-gray-500 resize-y',
                  'focus:outline-none focus:ring-2 focus:ring-bolt-elements-ring',
                )}
                placeholder="Describe what this screen should look like and do, or paste structured design JSON:

NATURAL LANGUAGE:
• Layout and visual design
• Interactive elements (buttons, forms, etc.) 
• Data to display or collect
• User interactions and behaviors
• Integration with other screens

STRUCTURED JSON:
Paste complete design specifications from Builder.io, Figma exports, or design tools with component hierarchy, responsive styles, and exact layout.

Example: 'A user profile page with photo, editable form, activity timeline, and settings panel' 

OR paste JSON starting with: blocks: [ ... ]"
                value={designRequirements}
                onChange={(e) => setDesignRequirements(e.target.value)}
              />
            </div>

            {/* Architecture Info */}
            <div className="p-4 bg-bolt-elements-background-depth-2 rounded-lg">
              <h4 className="font-medium text-bolt-elements-textPrimary mb-2">🏗️ Modular Architecture</h4>
              <div className="text-sm text-bolt-elements-textSecondary space-y-1">
                <p>
                  ✅ Self-contained folder structure:{' '}
                  <code>
                    src/screens/{screenType}s/{generateScreenId(screenName || 'screen-name')}/
                  </code>
                </p>
                <p>✅ Minimal dependencies and ripple effects</p>
                <p>✅ Inter-screen communication through well-defined interfaces</p>
                <p>✅ Automatic TypeScript types and responsive design</p>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-8">
            <Button variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!isFormValid}
              className={classNames(!isFormValid ? 'opacity-50 cursor-not-allowed' : '')}
            >
              {submitButtonText}
            </Button>
          </div>
        </div>
      </Dialog>
    </DialogRoot>
  );
};
