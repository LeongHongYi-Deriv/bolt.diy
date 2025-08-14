import { atom, map, type MapStore, type WritableAtom } from 'nanostores';
import type { ScreenAction, NavigationAction, ComponentAction } from '~/types/actions';

export interface ScreenMetadata {
  id: string;
  name: string;
  type: 'page' | 'modal' | 'drawer' | 'component';
  filePath: string;
  parentScreen?: string;
  children: string[];
  dependencies: string[];
  navigationTriggers: NavigationTrigger[];
  props?: Record<string, any>;
  isActive: boolean;
  lastModified: number;
  components: string[];
}

export interface NavigationTrigger {
  id: string;
  fromScreen: string;
  toScreen: string;
  trigger: string;
  navigationType: 'push' | 'replace' | 'modal' | 'drawer';
  params?: Record<string, any>;
}

export interface ComponentMetadata {
  name: string;
  filePath: string;
  type: 'shared' | 'screen-specific' | 'layout';
  usedByScreens: string[];
  exports: string[];
  imports: string[];
  lastModified: number;
}

export interface ScreenTemplate {
  id: string;
  name: string;
  description: string;
  type: 'page' | 'modal' | 'drawer' | 'component';
  files: TemplateFile[];
  dependencies: string[];
  navigationSetup?: NavigationSetup;
}

export interface TemplateFile {
  path: string;
  content: string;
  description: string;
}

export interface NavigationSetup {
  routePattern?: string;
  requiresAuth?: boolean;
  parentRoute?: string;
  defaultParams?: Record<string, any>;
}

class ScreenStore {
  #screens: MapStore<Record<string, ScreenMetadata>> = map({});

  #components: MapStore<Record<string, ComponentMetadata>> = map({});

  #navigationGraph: MapStore<Record<string, NavigationTrigger[]>> = map({});

  #activeScreen: WritableAtom<string | null> = atom(null);

  constructor() {
    // No template initialization needed for flexible system
  }

  // Screen management
  get screens() {
    return this.#screens;
  }

  get components() {
    return this.#components;
  }

  get navigationGraph() {
    return this.#navigationGraph;
  }

  get activeScreen() {
    return this.#activeScreen;
  }

  addScreen(screenData: ScreenAction) {
    const screen: ScreenMetadata = {
      id: screenData.screenId,
      name: screenData.screenName,
      type: screenData.screenType,
      filePath: this.#generateScreenFilePath(screenData),
      parentScreen: screenData.parentScreen,
      children: [],
      dependencies: screenData.dependencies || [],
      navigationTriggers: [],
      props: screenData.props,
      isActive: false,
      lastModified: Date.now(),
      components: [],
    };

    // Update parent-child relationships
    if (screenData.parentScreen) {
      const parentScreen = this.#screens.get()[screenData.parentScreen];

      if (parentScreen) {
        parentScreen.children.push(screenData.screenId);
        this.#screens.setKey(screenData.parentScreen, parentScreen);
      }
    }

    this.#screens.setKey(screenData.screenId, screen);

    // Set as active if it's the first screen
    if (Object.keys(this.#screens.get()).length === 1) {
      this.#activeScreen.set(screenData.screenId);
    }
  }

  addNavigation(navigationData: NavigationAction) {
    const trigger: NavigationTrigger = {
      id: `${navigationData.fromScreen}-${navigationData.toScreen}-${Date.now()}`,
      fromScreen: navigationData.fromScreen,
      toScreen: navigationData.toScreen,
      trigger: navigationData.trigger,
      navigationType: navigationData.navigationType,
      params: navigationData.params,
    };

    // Add to navigation graph
    const currentGraph = this.#navigationGraph.get();
    const fromScreenNav = currentGraph[navigationData.fromScreen] || [];
    fromScreenNav.push(trigger);
    this.#navigationGraph.setKey(navigationData.fromScreen, fromScreenNav);

    // Add to screen metadata
    const fromScreen = this.#screens.get()[navigationData.fromScreen];

    if (fromScreen) {
      fromScreen.navigationTriggers.push(trigger);
      this.#screens.setKey(navigationData.fromScreen, fromScreen);
    }
  }

  addComponent(componentData: ComponentAction) {
    const component: ComponentMetadata = {
      name: componentData.componentName,
      filePath: this.#generateComponentFilePath(componentData),
      type: componentData.componentType,
      usedByScreens: componentData.usedByScreens || [],
      exports: componentData.exports || [],
      imports: componentData.imports || [],
      lastModified: Date.now(),
    };

    this.#components.setKey(componentData.componentName, component);

    // Update screen dependencies
    component.usedByScreens.forEach((screenId) => {
      const screen = this.#screens.get()[screenId];

      if (screen && !screen.components.includes(componentData.componentName)) {
        screen.components.push(componentData.componentName);
        this.#screens.setKey(screenId, screen);
      }
    });
  }

  getScreenDependencies(screenId: string): string[] {
    const screen = this.#screens.get()[screenId];

    if (!screen) {
      return [];
    }

    const dependencies: string[] = [...screen.dependencies];

    // Add component dependencies
    screen.components.forEach((componentName) => {
      const component = this.#components.get()[componentName];

      if (component) {
        dependencies.push(...component.imports);
      }
    });

    return [...new Set(dependencies)];
  }

  getNavigationPaths(fromScreen: string): NavigationTrigger[] {
    return this.#navigationGraph.get()[fromScreen] || [];
  }

  getScreensByType(type: ScreenMetadata['type']): ScreenMetadata[] {
    return Object.values(this.#screens.get()).filter((screen) => screen.type === type);
  }

  removeScreen(screenId: string) {
    const screens = this.#screens.get();
    const screen = screens[screenId];

    if (!screen) {
      return;
    }

    // Remove from parent's children
    if (screen.parentScreen) {
      const parentScreen = screens[screen.parentScreen];

      if (parentScreen) {
        parentScreen.children = parentScreen.children.filter((id) => id !== screenId);
        this.#screens.setKey(screen.parentScreen, parentScreen);
      }
    }

    // Update children to remove parent reference
    screen.children.forEach((childId) => {
      const childScreen = screens[childId];

      if (childScreen) {
        childScreen.parentScreen = undefined;
        this.#screens.setKey(childId, childScreen);
      }
    });

    // Remove navigation references
    const navigationGraph = this.#navigationGraph.get();
    Object.keys(navigationGraph).forEach((fromScreenId) => {
      const triggers = navigationGraph[fromScreenId].filter((trigger) => trigger.toScreen !== screenId);
      this.#navigationGraph.setKey(fromScreenId, triggers);
    });

    delete navigationGraph[screenId];

    // Remove the screen
    const updatedScreens = { ...screens };
    delete updatedScreens[screenId];
    this.#screens.set(updatedScreens);

    // Update active screen if needed
    if (this.#activeScreen.get() === screenId) {
      const remainingScreens = Object.keys(updatedScreens);
      this.#activeScreen.set(remainingScreens.length > 0 ? remainingScreens[0] : null);
    }
  }

  setActiveScreen(screenId: string) {
    if (this.#screens.get()[screenId]) {
      this.#activeScreen.set(screenId);
    }
  }

  #generateScreenFilePath(screenData: ScreenAction): string {
    const basePath = 'src/screens';
    const screenName = screenData.screenName.toLowerCase().replace(/\s+/g, '-');

    switch (screenData.screenType) {
      case 'page':
        return `${basePath}/pages/${screenName}/${screenName}.tsx`;
      case 'modal':
        return `${basePath}/modals/${screenName}/${screenName}.tsx`;
      case 'drawer':
        return `${basePath}/drawers/${screenName}/${screenName}.tsx`;
      case 'component':
        return `${basePath}/components/${screenName}/${screenName}.tsx`;
      default:
        return `${basePath}/${screenName}/${screenName}.tsx`;
    }
  }

  #generateComponentFilePath(componentData: ComponentAction): string {
    const componentName = componentData.componentName;

    switch (componentData.componentType) {
      case 'shared':
        return `src/components/shared/${componentName}.tsx`;
      case 'layout':
        return `src/components/layout/${componentName}.tsx`;
      case 'screen-specific':
        return `src/components/screen-specific/${componentName}.tsx`;
      default:
        return `src/components/${componentName}.tsx`;
    }
  }

  reset() {
    this.#screens.set({});
    this.#components.set({});
    this.#navigationGraph.set({});
    this.#activeScreen.set(null);
  }
}

export const screenStore = new ScreenStore();
