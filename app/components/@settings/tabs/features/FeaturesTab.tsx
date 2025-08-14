// Remove unused imports
import React, { memo, useCallback, useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Switch } from '~/components/ui/Switch';
import { useSettings } from '~/lib/hooks/useSettings';
import { classNames } from '~/utils/classNames';
import { toast } from 'react-toastify';
import { PromptLibrary } from '~/lib/common/prompt-library';
import { PROVIDER_LIST } from '~/utils/constants';
import type { ModelInfo } from '~/lib/modules/llm/types';
import type { ProviderInfo } from '~/types/model';

interface FeatureToggle {
  id: string;
  title: string;
  description: string;
  icon: string;
  enabled: boolean;
  beta?: boolean;
  experimental?: boolean;
  tooltip?: string;
}

const FeatureCard = memo(
  ({
    feature,
    index,
    onToggle,
  }: {
    feature: FeatureToggle;
    index: number;
    onToggle: (id: string, enabled: boolean) => void;
  }) => (
    <motion.div
      key={feature.id}
      layoutId={feature.id}
      className={classNames(
        'relative group cursor-pointer',
        'bg-bolt-elements-background-depth-2',
        'hover:bg-bolt-elements-background-depth-3',
        'transition-colors duration-200',
        'rounded-lg overflow-hidden',
      )}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
    >
      <div className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={classNames(feature.icon, 'w-5 h-5 text-bolt-elements-textSecondary')} />
            <div className="flex items-center gap-2">
              <h4 className="font-medium text-bolt-elements-textPrimary">{feature.title}</h4>
              {feature.beta && (
                <span className="px-2 py-0.5 text-xs rounded-full bg-blue-500/10 text-blue-500 font-medium">Beta</span>
              )}
              {feature.experimental && (
                <span className="px-2 py-0.5 text-xs rounded-full bg-orange-500/10 text-orange-500 font-medium">
                  Experimental
                </span>
              )}
            </div>
          </div>
          <Switch checked={feature.enabled} onCheckedChange={(checked) => onToggle(feature.id, checked)} />
        </div>
        <p className="mt-2 text-sm text-bolt-elements-textSecondary">{feature.description}</p>
        {feature.tooltip && <p className="mt-1 text-xs text-bolt-elements-textTertiary">{feature.tooltip}</p>}
      </div>
    </motion.div>
  ),
);

const FeatureSection = memo(
  ({
    title,
    features,
    icon,
    description,
    onToggleFeature,
  }: {
    title: string;
    features: FeatureToggle[];
    icon: string;
    description: string;
    onToggleFeature: (id: string, enabled: boolean) => void;
  }) => (
    <motion.div
      layout
      className="flex flex-col gap-4"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="flex items-center gap-3">
        <div className={classNames(icon, 'text-xl text-purple-500')} />
        <div>
          <h3 className="text-lg font-medium text-bolt-elements-textPrimary">{title}</h3>
          <p className="text-sm text-bolt-elements-textSecondary">{description}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {features.map((feature, index) => (
          <FeatureCard key={feature.id} feature={feature} index={index} onToggle={onToggleFeature} />
        ))}
      </div>
    </motion.div>
  ),
);

export default function FeaturesTab() {
  const {
    autoSelectTemplate,
    isLatestBranch,
    contextOptimizationEnabled,
    eventLogs,
    setAutoSelectTemplate,
    enableLatestBranch,
    enableContextOptimization,
    setEventLogs,
    setPromptId,
    promptId,
    modelDifferentiation,
    setModelDifferentiation,
    summaryModel,
    setSummaryModel,
    summaryProvider,
    setSummaryProvider,
    contextModel,
    setContextModel,
    contextProvider,
    setContextProvider,
  } = useSettings();

  const [modelList, setModelList] = useState<ModelInfo[]>([]);
  const [providerList] = useState<ProviderInfo[]>(PROVIDER_LIST as ProviderInfo[]);

  // Fetch available models
  useEffect(() => {
    fetch('/api/models')
      .then((response) => response.json())
      .then((data) => {
        const typedData = data as { modelList: ModelInfo[] };
        setModelList(typedData.modelList);
      })
      .catch((error) => {
        console.error('Error fetching models:', error);
      });
  }, []);

  // Enable features by default on first load
  React.useEffect(() => {
    // Only set defaults if values are undefined
    if (isLatestBranch === undefined) {
      enableLatestBranch(false); // Default: OFF - Don't auto-update from main branch
    }

    if (contextOptimizationEnabled === undefined) {
      enableContextOptimization(true); // Default: ON - Enable context optimization
    }

    if (autoSelectTemplate === undefined) {
      setAutoSelectTemplate(true); // Default: ON - Enable auto-select templates
    }

    if (promptId === undefined) {
      setPromptId('default'); // Default: 'default'
    }

    if (eventLogs === undefined) {
      setEventLogs(true); // Default: ON - Enable event logging
    }
  }, []); // Only run once on component mount

  const handleToggleFeature = useCallback(
    (id: string, enabled: boolean) => {
      switch (id) {
        case 'latestBranch': {
          enableLatestBranch(enabled);
          toast.success(`Main branch updates ${enabled ? 'enabled' : 'disabled'}`);
          break;
        }

        case 'autoSelectTemplate': {
          setAutoSelectTemplate(enabled);
          toast.success(`Auto select template ${enabled ? 'enabled' : 'disabled'}`);
          break;
        }

        case 'contextOptimization': {
          enableContextOptimization(enabled);
          toast.success(`Context optimization ${enabled ? 'enabled' : 'disabled'}`);
          break;
        }

        case 'eventLogs': {
          setEventLogs(enabled);
          toast.success(`Event logging ${enabled ? 'enabled' : 'disabled'}`);
          break;
        }

        case 'modelDifferentiation': {
          setModelDifferentiation(enabled);
          toast.success(`Model differentiation ${enabled ? 'enabled' : 'disabled'}`);
          break;
        }

        default:
          break;
      }
    },
    [enableLatestBranch, setAutoSelectTemplate, enableContextOptimization, setEventLogs],
  );

  const features = {
    stable: [
      {
        id: 'latestBranch',
        title: 'Main Branch Updates',
        description: 'Get the latest updates from the main branch',
        icon: 'i-ph:git-branch',
        enabled: isLatestBranch,
        tooltip: 'Enabled by default to receive updates from the main development branch',
      },
      {
        id: 'autoSelectTemplate',
        title: 'Auto Select Template',
        description: 'Automatically select starter template',
        icon: 'i-ph:selection',
        enabled: autoSelectTemplate,
        tooltip: 'Enabled by default to automatically select the most appropriate starter template',
      },
      {
        id: 'contextOptimization',
        title: 'Context Optimization',
        description: 'Optimize context for better responses',
        icon: 'i-ph:brain',
        enabled: contextOptimizationEnabled,
        tooltip: 'Enabled by default for improved AI responses',
      },
      {
        id: 'eventLogs',
        title: 'Event Logging',
        description: 'Enable detailed event logging and history',
        icon: 'i-ph:list-bullets',
        enabled: eventLogs,
        tooltip: 'Enabled by default to record detailed logs of system events and user actions',
      },
      {
        id: 'modelDifferentiation',
        title: 'Model Differentiation',
        description: 'Use different models for different tasks to optimize cost and performance',
        icon: 'i-ph:brain',
        enabled: modelDifferentiation,
        tooltip: 'Allows you to select specific models for chat summarization and context selection tasks',
        beta: true,
      },
    ],
    beta: [],
  };

  return (
    <div className="flex flex-col gap-8">
      <FeatureSection
        title="Core Features"
        features={features.stable}
        icon="i-ph:check-circle"
        description="Essential features that are enabled by default for optimal performance"
        onToggleFeature={handleToggleFeature}
      />

      {features.beta.length > 0 && (
        <FeatureSection
          title="Beta Features"
          features={features.beta}
          icon="i-ph:test-tube"
          description="New features that are ready for testing but may have some rough edges"
          onToggleFeature={handleToggleFeature}
        />
      )}

      <motion.div
        layout
        className={classNames(
          'bg-bolt-elements-background-depth-2',
          'hover:bg-bolt-elements-background-depth-3',
          'transition-all duration-200',
          'rounded-lg p-4',
          'group',
        )}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <div className="flex items-center gap-4">
          <div
            className={classNames(
              'p-2 rounded-lg text-xl',
              'bg-bolt-elements-background-depth-3 group-hover:bg-bolt-elements-background-depth-4',
              'transition-colors duration-200',
              'text-purple-500',
            )}
          >
            <div className="i-ph:book" />
          </div>
          <div className="flex-1">
            <h4 className="text-sm font-medium text-bolt-elements-textPrimary group-hover:text-purple-500 transition-colors">
              Prompt Library
            </h4>
            <p className="text-xs text-bolt-elements-textSecondary mt-0.5">
              Choose a prompt from the library to use as the system prompt
            </p>
          </div>
          <select
            value={promptId}
            onChange={(e) => {
              setPromptId(e.target.value);
              toast.success('Prompt template updated');
            }}
            className={classNames(
              'p-2 rounded-lg text-sm min-w-[200px]',
              'bg-bolt-elements-background-depth-3 border border-bolt-elements-borderColor',
              'text-bolt-elements-textPrimary',
              'focus:outline-none focus:ring-2 focus:ring-purple-500/30',
              'group-hover:border-purple-500/30',
              'transition-all duration-200',
            )}
          >
            {PromptLibrary.getList().map((x) => (
              <option key={x.id} value={x.id}>
                {x.label}
              </option>
            ))}
          </select>
        </div>
      </motion.div>

      {modelDifferentiation && (
        <motion.div
          className="flex flex-col gap-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <div className="flex items-center gap-3">
            <div className="i-ph:robot text-xl text-purple-500" />
            <div>
              <h3 className="text-lg font-medium text-bolt-elements-textPrimary">Model Configuration</h3>
              <p className="text-sm text-bolt-elements-textSecondary">
                Configure specific models for different AI tasks to optimize cost and performance
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Chat History Summarizer */}
            <motion.div
              className={classNames(
                'bg-bolt-elements-background-depth-2',
                'hover:bg-bolt-elements-background-depth-3',
                'transition-colors duration-200',
                'rounded-lg p-4',
              )}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 }}
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="i-ph:chat-circle text-lg text-blue-500" />
                <div>
                  <h4 className="font-medium text-bolt-elements-textPrimary">Chat History Summarizer</h4>
                  <p className="text-xs text-bolt-elements-textSecondary">
                    Model used for summarizing chat history to reduce token usage
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-bolt-elements-textSecondary mb-1">Provider</label>
                  <select
                    value={summaryProvider}
                    onChange={(e) => {
                      setSummaryProvider(e.target.value);
                      toast.success('Summary provider updated');
                    }}
                    className={classNames(
                      'w-full p-2 rounded-lg text-sm',
                      'bg-bolt-elements-background-depth-3 border border-bolt-elements-borderColor',
                      'text-bolt-elements-textPrimary',
                      'focus:outline-none focus:ring-2 focus:ring-blue-500/30',
                      'transition-all duration-200',
                    )}
                  >
                    {providerList.map((provider) => (
                      <option key={provider.name} value={provider.name}>
                        {provider.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-bolt-elements-textSecondary mb-1">Model</label>
                  <select
                    value={summaryModel}
                    onChange={(e) => {
                      setSummaryModel(e.target.value);
                      toast.success('Summary model updated');
                    }}
                    className={classNames(
                      'w-full p-2 rounded-lg text-sm',
                      'bg-bolt-elements-background-depth-3 border border-bolt-elements-borderColor',
                      'text-bolt-elements-textPrimary',
                      'focus:outline-none focus:ring-2 focus:ring-blue-500/30',
                      'transition-all duration-200',
                    )}
                  >
                    {modelList
                      .filter((model) => model.provider === summaryProvider)
                      .map((model) => (
                        <option key={model.name} value={model.name}>
                          {model.label || model.name}
                        </option>
                      ))}
                  </select>
                </div>
              </div>
            </motion.div>

            {/* Context Selection */}
            <motion.div
              className={classNames(
                'bg-bolt-elements-background-depth-2',
                'hover:bg-bolt-elements-background-depth-3',
                'transition-colors duration-200',
                'rounded-lg p-4',
              )}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.6 }}
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="i-ph:files text-lg text-green-500" />
                <div>
                  <h4 className="font-medium text-bolt-elements-textPrimary">Context Selection</h4>
                  <p className="text-xs text-bolt-elements-textSecondary">
                    Model used for selecting relevant files and context
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-bolt-elements-textSecondary mb-1">Provider</label>
                  <select
                    value={contextProvider}
                    onChange={(e) => {
                      setContextProvider(e.target.value);
                      toast.success('Context provider updated');
                    }}
                    className={classNames(
                      'w-full p-2 rounded-lg text-sm',
                      'bg-bolt-elements-background-depth-3 border border-bolt-elements-borderColor',
                      'text-bolt-elements-textPrimary',
                      'focus:outline-none focus:ring-2 focus:ring-green-500/30',
                      'transition-all duration-200',
                    )}
                  >
                    {providerList.map((provider) => (
                      <option key={provider.name} value={provider.name}>
                        {provider.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-bolt-elements-textSecondary mb-1">Model</label>
                  <select
                    value={contextModel}
                    onChange={(e) => {
                      setContextModel(e.target.value);
                      toast.success('Context model updated');
                    }}
                    className={classNames(
                      'w-full p-2 rounded-lg text-sm',
                      'bg-bolt-elements-background-depth-3 border border-bolt-elements-borderColor',
                      'text-bolt-elements-textPrimary',
                      'focus:outline-none focus:ring-2 focus:ring-green-500/30',
                      'transition-all duration-200',
                    )}
                  >
                    {modelList
                      .filter((model) => model.provider === contextProvider)
                      .map((model) => (
                        <option key={model.name} value={model.name}>
                          {model.label || model.name}
                        </option>
                      ))}
                  </select>
                </div>
              </div>
            </motion.div>
          </div>
        </motion.div>
      )}
    </div>
  );
}
