/**
 * Screen-based Architecture Conventions
 *
 * This file defines the conventions and utilities for the modular screen system
 * that enables plug-and-play screen development with minimal ripple effects.
 */

export interface ScreenConventions {
  structure: ProjectStructure;
  naming: NamingConventions;
  fileTemplates: FileTemplates;
  dependencies: DependencyManagement;
}

export interface ProjectStructure {
  screens: {
    pages: string;
    modals: string;
    drawers: string;
    components: string;
  };
  shared: {
    components: string;
    layouts: string;
    utils: string;
    types: string;
  };
  navigation: {
    routes: string;
    config: string;
  };
}

export interface NamingConventions {
  screenId: (name: string) => string;
  componentName: (name: string) => string;
  fileName: (name: string, type: 'screen' | 'component' | 'style') => string;
  folderName: (name: string) => string;
}

export interface FileTemplates {
  screen: (screenName: string, screenType: string) => string;
  component: (componentName: string) => string;
  styles: (screenId: string) => string;
  types: (screenName: string) => string;
  index: (screenName: string) => string;
}

export interface DependencyManagement {
  requiredDependencies: string[];
  optionalDependencies: Record<string, string[]>;
  peerDependencies: string[];
}

/**
 * Default project structure for screen-based architecture
 */
export const DEFAULT_PROJECT_STRUCTURE: ProjectStructure = {
  screens: {
    pages: 'src/screens/pages',
    modals: 'src/screens/modals',
    drawers: 'src/screens/drawers',
    components: 'src/screens/components',
  },
  shared: {
    components: 'src/components/shared',
    layouts: 'src/components/layout',
    utils: 'src/utils',
    types: 'src/types',
  },
  navigation: {
    routes: 'src/routes',
    config: 'src/config',
  },
};

/**
 * Naming conventions for consistent file and component naming
 */
export const NAMING_CONVENTIONS: NamingConventions = {
  screenId: (name: string): string => {
    return name
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '');
  },

  componentName: (name: string): string => {
    return name
      .replace(/\s+/g, '')
      .replace(/[^a-zA-Z0-9]/g, '')
      .replace(/^./, (str) => str.toUpperCase());
  },

  fileName: (name: string, type: 'screen' | 'component' | 'style'): string => {
    const kebabName = name
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '');

    switch (type) {
      case 'screen':
      case 'component':
        return `${kebabName}.tsx`;
      case 'style':
        return `${kebabName}.module.css`;
      default:
        return `${kebabName}.ts`;
    }
  },

  folderName: (name: string): string => {
    return name
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '');
  },
};

/**
 * File templates for generating consistent screen and component files
 */
export const FILE_TEMPLATES: FileTemplates = {
  screen: (screenName: string, screenType: string): string => {
    const componentName = NAMING_CONVENTIONS.componentName(screenName);
    const screenId = NAMING_CONVENTIONS.screenId(screenName);

    return `import React from 'react';
import styles from './${screenId}.module.css';

interface ${componentName}Props {
  // Define your props here
}

export const ${componentName}: React.FC<${componentName}Props> = (props) => {
  return (
    <div className={styles.container}>
      <h1>${screenName}</h1>
      {/* Your ${screenType} content here */}
    </div>
  );
};

export default ${componentName};`;
  },

  component: (componentName: string): string => {
    const name = NAMING_CONVENTIONS.componentName(componentName);

    return `import React from 'react';

interface ${name}Props {
  // Define your props here
}

export const ${name}: React.FC<${name}Props> = (props) => {
  return (
    <div>
      {/* Your component content here */}
    </div>
  );
};`;
  },

  styles: (screenId: string): string => {
    return `.container {
  /* Main container styles */
  min-height: 100vh;
  padding: 1rem;
}

.${screenId} {
  /* Screen-specific styles */
}

/* Add your custom styles here */`;
  },

  types: (screenName: string): string => {
    const componentName = NAMING_CONVENTIONS.componentName(screenName);

    return `export interface ${componentName}Props {
  // Define your props interface here
}

export interface ${componentName}State {
  // Define your state interface here (if using class components)
}

// Add your custom types here`;
  },

  index: (screenName: string): string => {
    const componentName = NAMING_CONVENTIONS.componentName(screenName);
    const fileName = NAMING_CONVENTIONS.fileName(screenName, 'screen');

    return `export { default as ${componentName} } from './${fileName.replace('.tsx', '')}';
export type { ${componentName}Props } from './${fileName.replace('.tsx', '')}';`;
  },
};

/**
 * Dependency management for screen-based architecture
 */
export const DEPENDENCY_MANAGEMENT: DependencyManagement = {
  requiredDependencies: ['react', 'react-dom'],

  optionalDependencies: {
    routing: ['react-router-dom', '@reach/router'],
    stateManagement: ['zustand', 'jotai', 'valtio'],
    forms: ['react-hook-form', 'formik'],
    validation: ['zod', 'yup', 'joi'],
    styling: ['styled-components', 'emotion', 'tailwindcss'],
    animation: ['framer-motion', 'react-spring'],
    ui: ['@radix-ui/react-dialog', '@headlessui/react', 'chakra-ui'],
  },

  peerDependencies: ['typescript'],
};

/**
 * Utility functions for screen management
 */
export class ScreenConventionUtils {
  static generateScreenPath(screenName: string, screenType: 'page' | 'modal' | 'drawer' | 'component'): string {
    const folderName = NAMING_CONVENTIONS.folderName(screenName);
    const basePath =
      DEFAULT_PROJECT_STRUCTURE.screens[`${screenType}s` as keyof typeof DEFAULT_PROJECT_STRUCTURE.screens];

    return `${basePath}/${folderName}`;
  }

  static generateComponentPath(componentName: string, componentType: 'shared' | 'layout' | 'screen-specific'): string {
    const fileName = NAMING_CONVENTIONS.fileName(componentName, 'component');

    if (componentType === 'screen-specific') {
      return `src/components/screen-specific/${fileName}`;
    }

    const basePath = DEFAULT_PROJECT_STRUCTURE.shared[componentType as keyof typeof DEFAULT_PROJECT_STRUCTURE.shared];

    return `${basePath}/${fileName}`;
  }

  static validateScreenStructure(filePaths: string[]): { valid: boolean; issues: string[] } {
    const issues: string[] = [];

    // Check for required files in screen folders
    const screenFolders = filePaths
      .filter((path) => path.includes('/screens/'))
      .map((path) => path.split('/').slice(0, -1).join('/'))
      .filter((value, index, self) => self.indexOf(value) === index);

    screenFolders.forEach((folder) => {
      const folderFiles = filePaths.filter((path) => path.startsWith(folder));
      const hasMainComponent = folderFiles.some((file) => file.endsWith('.tsx') && !file.includes('/components/'));
      const hasStyles = folderFiles.some((file) => file.endsWith('.module.css'));

      if (!hasMainComponent) {
        issues.push(`Missing main component file in ${folder}`);
      }

      if (!hasStyles) {
        issues.push(`Missing styles file in ${folder}`);
      }
    });

    return {
      valid: issues.length === 0,
      issues,
    };
  }

  static getScreenDependencies(screenType: 'page' | 'modal' | 'drawer' | 'component'): string[] {
    const base = DEPENDENCY_MANAGEMENT.requiredDependencies;

    switch (screenType) {
      case 'page':
        return [...base, ...DEPENDENCY_MANAGEMENT.optionalDependencies.routing];
      case 'modal':
      case 'drawer':
        return [...base, ...DEPENDENCY_MANAGEMENT.optionalDependencies.ui];
      case 'component':
        return base;
      default:
        return base;
    }
  }

  static generateScreenMetadata(screenName: string, screenType: 'page' | 'modal' | 'drawer' | 'component') {
    const screenId = NAMING_CONVENTIONS.screenId(screenName);
    const componentName = NAMING_CONVENTIONS.componentName(screenName);
    const folderPath = this.generateScreenPath(screenName, screenType);
    const filePath = `${folderPath}/${NAMING_CONVENTIONS.fileName(screenName, 'screen')}`;

    return {
      screenId,
      componentName,
      folderPath,
      filePath,
      dependencies: this.getScreenDependencies(screenType),
      files: {
        main: `${folderPath}/${NAMING_CONVENTIONS.fileName(screenName, 'screen')}`,
        styles: `${folderPath}/${NAMING_CONVENTIONS.fileName(screenName, 'style')}`,
        types: `${folderPath}/types.ts`,
        index: `${folderPath}/index.ts`,
      },
    };
  }
}

/**
 * Best practices for screen development
 */
export const SCREEN_BEST_PRACTICES = {
  principles: [
    'Each screen should be self-contained with minimal external dependencies',
    'Use declarative navigation instead of imperative routing',
    'Prefer composition over inheritance for screen layouts',
    'Keep screen-specific logic within the screen folder',
    'Use shared components for common UI patterns',
    'Define clear interfaces for screen props and state',
    'Follow consistent naming conventions across all screens',
  ],

  folderStructure: [
    'Main component file (screen-name.tsx)',
    'Styles file (screen-name.module.css)',
    'Types file (types.ts) - optional',
    'Index file (index.ts) - for clean exports',
    'Local components folder (components/) - for screen-specific components',
    'Utils folder (utils/) - for screen-specific utilities',
  ],

  avoidances: [
    'Do not import components from other screens directly',
    'Do not create deep component hierarchies within screens',
    'Do not use global state for screen-specific data',
    'Do not hardcode navigation paths in components',
    'Do not mix business logic with presentation logic',
  ],
};

export default {
  structure: DEFAULT_PROJECT_STRUCTURE,
  naming: NAMING_CONVENTIONS,
  templates: FILE_TEMPLATES,
  dependencies: DEPENDENCY_MANAGEMENT,
  utils: ScreenConventionUtils,
  bestPractices: SCREEN_BEST_PRACTICES,
};
