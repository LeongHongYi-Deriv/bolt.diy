import type { Change } from 'diff';

export type ActionType = 'file' | 'shell' | 'start' | 'build' | 'supabase' | 'screen' | 'navigation' | 'component';

export interface BaseAction {
  content: string;
}

export interface FileAction extends BaseAction {
  type: 'file';
  filePath: string;
}

export interface ShellAction extends BaseAction {
  type: 'shell';
}

export interface StartAction extends BaseAction {
  type: 'start';
}

export interface BuildAction extends BaseAction {
  type: 'build';
}

export interface SupabaseAction extends BaseAction {
  type: 'supabase';
  operation: 'migration' | 'query';
  filePath?: string;
  projectId?: string;
}

export interface ScreenAction extends BaseAction {
  type: 'screen';
  screenId: string;
  screenType: 'page' | 'modal' | 'drawer' | 'component';
  screenName: string;
  parentScreen?: string;
  navigationTrigger?: string;
  dependencies?: string[];
  props?: Record<string, any>;
}

export interface NavigationAction extends BaseAction {
  type: 'navigation';
  fromScreen: string;
  toScreen: string;
  trigger: string;
  navigationType: 'push' | 'replace' | 'modal' | 'drawer';
  params?: Record<string, any>;
}

export interface ComponentAction extends BaseAction {
  type: 'component';
  componentName: string;
  componentType: 'shared' | 'screen-specific' | 'layout';
  usedByScreens?: string[];
  exports?: string[];
  imports?: string[];
}

export type BoltAction =
  | FileAction
  | ShellAction
  | StartAction
  | BuildAction
  | SupabaseAction
  | ScreenAction
  | NavigationAction
  | ComponentAction;

export type BoltActionData = BoltAction | BaseAction;

export interface ActionAlert {
  type: string;
  title: string;
  description: string;
  content: string;
  source?: 'terminal' | 'preview'; // Add source to differentiate between terminal and preview errors
}

export interface SupabaseAlert {
  type: string;
  title: string;
  description: string;
  content: string;
  source?: 'supabase';
}

export interface DeployAlert {
  type: 'success' | 'error' | 'info';
  title: string;
  description: string;
  content?: string;
  url?: string;
  stage?: 'building' | 'deploying' | 'complete';
  buildStatus?: 'pending' | 'running' | 'complete' | 'failed';
  deployStatus?: 'pending' | 'running' | 'complete' | 'failed';
  source?: 'vercel' | 'netlify' | 'github';
}

export interface LlmErrorAlertType {
  type: 'error' | 'warning';
  title: string;
  description: string;
  content?: string;
  provider?: string;
  errorType?: 'authentication' | 'rate_limit' | 'quota' | 'network' | 'unknown';
}

export interface FileHistory {
  originalContent: string;
  lastModified: number;
  changes: Change[];
  versions: {
    timestamp: number;
    content: string;
  }[];

  // Novo campo para rastrear a origem das mudanças
  changeSource?: 'user' | 'auto-save' | 'external';
}
