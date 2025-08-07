import { BaseProvider, getOpenAILikeModel } from '~/lib/modules/llm/base-provider';
import type { ModelInfo } from '~/lib/modules/llm/types';
import type { IProviderSetting } from '~/types/model';
import type { LanguageModelV1 } from 'ai';

export default class LiteLLMProvider extends BaseProvider {
  name = 'LiteLLM';
  getApiKeyLink = undefined;
  labelForGetApiKey = 'Get LiteLLM API Key';
  icon = 'i-simple-icons:openai'; // Using OpenAI icon as placeholder

  config = {
    baseUrlKey: 'LITELLM_API_BASE_URL',
    apiTokenKey: 'LITELLM_API_KEY',
  };

  staticModels: ModelInfo[] = [
    // Claude Models (Available to your team) - with correct token limits
    {
      name: 'claude-4-sonnet',
      label: 'Claude 4 Sonnet',
      provider: 'LiteLLM',
      maxTokenAllowed: 64000, // Corrected from 200000
    },
    {
      name: 'claude-3-7-sonnet-latest',
      label: 'Claude 3.7 Sonnet',
      provider: 'LiteLLM',
      maxTokenAllowed: 64000, // Corrected from 200000 based on error logs
    },
    {
      name: 'claude-3-5-sonnet-latest',
      label: 'Claude 3.5 Sonnet',
      provider: 'LiteLLM',
      maxTokenAllowed: 64000, // Corrected from 200000
    },
    {
      name: 'claude-3-5-haiku-latest',
      label: 'Claude 3.5 Haiku',
      provider: 'LiteLLM',
      maxTokenAllowed: 64000, // Corrected from 200000
    },

    // OpenAI Models
    {
      name: 'gpt-4o',
      label: 'GPT-4o',
      provider: 'LiteLLM',
      maxTokenAllowed: 128000,
    },
    {
      name: 'chatgpt-4o-latest',
      label: 'ChatGPT-4o Latest',
      provider: 'LiteLLM',
      maxTokenAllowed: 128000,
    },
    {
      name: 'chatgpt-4o-mini',
      label: 'ChatGPT-4o Mini',
      provider: 'LiteLLM',
      maxTokenAllowed: 128000,
    },
    {
      name: 'gpt-4o-search-preview',
      label: 'GPT-4o Search Preview',
      provider: 'LiteLLM',
      maxTokenAllowed: 128000,
    },
    {
      name: 'gpt-4o-mini-search-preview',
      label: 'GPT-4o Mini Search Preview',
      provider: 'LiteLLM',
      maxTokenAllowed: 128000,
    },

    // Next-generation GPT Models
    {
      name: 'gpt-4.1',
      label: 'GPT-4.1',
      provider: 'LiteLLM',
      maxTokenAllowed: 128000,
    },
    {
      name: 'gpt-4.1-mini',
      label: 'GPT-4.1 Mini',
      provider: 'LiteLLM',
      maxTokenAllowed: 128000,
    },
    {
      name: 'gpt-4.1-nano',
      label: 'GPT-4.1 Nano',
      provider: 'LiteLLM',
      maxTokenAllowed: 32000, // Smaller for nano version
    },

    // O-series Models
    {
      name: 'o3',
      label: 'OpenAI O3',
      provider: 'LiteLLM',
      maxTokenAllowed: 128000,
    },
    {
      name: 'o3-mini',
      label: 'OpenAI O3 Mini',
      provider: 'LiteLLM',
      maxTokenAllowed: 65536, // More conservative for mini
    },
    {
      name: 'o4-mini',
      label: 'OpenAI O4 Mini',
      provider: 'LiteLLM',
      maxTokenAllowed: 65536, // More conservative for mini
    },

    // Google Gemini Models
    {
      name: 'gemini-2.0-flash-001',
      label: 'Gemini 2.0 Flash',
      provider: 'LiteLLM',
      maxTokenAllowed: 32000, // Conservative limit for Gemini
    },
    {
      name: 'gemini-2.0-flash-lite-001',
      label: 'Gemini 2.0 Flash Lite',
      provider: 'LiteLLM',
      maxTokenAllowed: 32000,
    },
    {
      name: 'gemini-1.5-pro-002',
      label: 'Gemini 1.5 Pro',
      provider: 'LiteLLM',
      maxTokenAllowed: 32000,
    },
    {
      name: 'gemini-2.5-flash',
      label: 'Gemini 2.5 Flash',
      provider: 'LiteLLM',
      maxTokenAllowed: 32000,
    },
    {
      name: 'gemini-2.5-pro',
      label: 'Gemini 2.5 Pro',
      provider: 'LiteLLM',
      maxTokenAllowed: 32000,
    },

    // Other Popular Models
    {
      name: 'deepseek-r1',
      label: 'DeepSeek R1',
      provider: 'LiteLLM',
      maxTokenAllowed: 32000,
    },
    {
      name: 'amazon-nova-pro',
      label: 'Amazon Nova Pro',
      provider: 'LiteLLM',
      maxTokenAllowed: 32000,
    },
    {
      name: 'pixtral-large',
      label: 'Pixtral Large',
      provider: 'LiteLLM',
      maxTokenAllowed: 32000,
    },

    // Grok Models
    {
      name: 'grok-2-vision-1212',
      label: 'Grok 2 Vision',
      provider: 'LiteLLM',
      maxTokenAllowed: 32000,
    },
    {
      name: 'grok-3',
      label: 'Grok 3',
      provider: 'LiteLLM',
      maxTokenAllowed: 32000,
    },
    {
      name: 'grok-3-fast',
      label: 'Grok 3 Fast',
      provider: 'LiteLLM',
      maxTokenAllowed: 32000,
    },
    {
      name: 'grok-3-mini',
      label: 'Grok 3 Mini',
      provider: 'LiteLLM',
      maxTokenAllowed: 16000, // Smaller for mini
    },
    {
      name: 'grok-4',
      label: 'Grok 4',
      provider: 'LiteLLM',
      maxTokenAllowed: 32000,
    },

    // Llama Models
    {
      name: 'llama-4-scout',
      label: 'Llama 4 Scout',
      provider: 'LiteLLM',
      maxTokenAllowed: 32000,
    },
    {
      name: 'llama-4-maverick',
      label: 'Llama 4 Maverick',
      provider: 'LiteLLM',
      maxTokenAllowed: 32000,
    },
  ];

  // Disable dynamic model fetching since your LiteLLM endpoint returns 404 for /v1/models
  async getDynamicModels(
    _apiKeys?: Record<string, string>,
    _settings?: IProviderSetting,
    _serverEnv: Record<string, string> = {},
  ): Promise<ModelInfo[]> {
    /*
     * Return empty array to disable dynamic model fetching
     * Your LiteLLM endpoint doesn't support the /v1/models endpoint (returns 404)
     */
    return [];
  }

  getModelInstance(options: {
    model: string;
    serverEnv: Env;
    apiKeys?: Record<string, string>;
    providerSettings?: Record<string, IProviderSetting>;
  }): LanguageModelV1 {
    const { model, serverEnv, apiKeys, providerSettings } = options;

    const { baseUrl, apiKey } = this.getProviderBaseUrlAndKey({
      apiKeys,
      providerSettings: providerSettings?.[this.name],
      serverEnv: serverEnv as any,
      defaultBaseUrlKey: 'LITELLM_API_BASE_URL',
      defaultApiTokenKey: 'LITELLM_API_KEY',
    });

    if (!baseUrl || !apiKey) {
      throw new Error(
        `Missing configuration for ${this.name} provider. Please set LITELLM_API_BASE_URL and LITELLM_API_KEY.`,
      );
    }

    // LiteLLM uses OpenAI-compatible endpoints, typically /v1/chat/completions
    const litellmBaseUrl = baseUrl.endsWith('/v1') ? baseUrl : `${baseUrl}/v1`;

    return getOpenAILikeModel(litellmBaseUrl, apiKey, model);
  }
}
