import { useState } from 'react';
import { Head, useForm } from '@inertiajs/react';
import ComicLayout from '@/Layouts/ComicLayout';
import { toast } from 'react-hot-toast';
import axios from 'axios';

const PROVIDER_DEFAULTS = {
    openai: { ai_base_url: '', ai_model: 'gpt-4o' },
    gemini: { ai_base_url: '', ai_model: 'gemini-1.5-pro' },
    anthropic: { ai_base_url: '', ai_model: 'claude-3-haiku-20240307' },
    ollama: { ai_base_url: 'http://127.0.0.1:11434/v1', ai_model: 'gemma4:e4b' },
    custom: { ai_base_url: '', ai_model: '' },
};

export default function Index({ auth, settings }) {
    const [testing, setTesting] = useState(false);
    const [testResult, setTestResult] = useState(null);

    const { data, setData, post, processing, errors } = useForm({
        ai_enabled: settings.ai_enabled || '0',
        ai_provider: settings.ai_provider || 'openai',
        ai_base_url: settings.ai_base_url || '',
        ai_api_key: settings.ai_api_key ? '********' : '',
        ai_model: settings.ai_model || 'gpt-4o',
    });

    const handleProviderChange = (provider) => {
        const defaults = PROVIDER_DEFAULTS[provider] || PROVIDER_DEFAULTS.custom;
        setData((current) => ({
            ...current,
            ai_provider: provider,
            ai_base_url: defaults.ai_base_url,
            ai_model: defaults.ai_model || current.ai_model,
        }));
    };

    const submit = (e) => {
        e.preventDefault();
        post(route('admin.settings.update'), {
            preserveScroll: true,
            onSuccess: () => toast.success('Settings saved successfully!'),
        });
    };

    const runTest = async () => {
        if (!data.ai_model?.trim()) {
            toast.error('Enter a model name before testing.');
            return;
        }

        setTesting(true);
        setTestResult(null);

        try {
            const response = await axios.post(route('admin.settings.test'), {
                ai_provider: data.ai_provider,
                ai_base_url: data.ai_base_url,
                ai_api_key: data.ai_api_key,
                ai_model: data.ai_model,
            });

            setTestResult(response.data);
            toast.success(`Connection OK (${response.data.latency_ms}ms)`);
        } catch (error) {
            const payload = error.response?.data ?? {
                success: false,
                message: error.message || 'Connection test failed.',
            };
            setTestResult(payload);
            toast.error(payload.message || 'Connection test failed.');
        } finally {
            setTesting(false);
        }
    };

    return (
        <ComicLayout
            auth={auth}
            header={<h2 className="font-semibold text-xl text-gray-200 leading-tight">Settings</h2>}
        >
            <Head title="AI Settings" />

            <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    <div className="bg-[#16161f] border border-white/5 overflow-hidden shadow-xl sm:rounded-lg p-6 lg:p-8">
                        
                        <div className="mb-8">
                            <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
                                </svg>
                                AI Auto-Tagging System
                            </h3>
                            <p className="text-sm text-gray-400 mt-1">
                                Automatically extract summaries, ratings, and genre tags from uploaded PDFs using LLMs.
                            </p>
                        </div>

                        <form onSubmit={submit} className="space-y-6 max-w-2xl">
                            {/* Enable Toggle */}
                            <div className="flex items-center justify-between p-4 rounded-lg bg-white/5 border border-white/10">
                                <div>
                                    <label className="text-white font-medium">Enable AI Processing</label>
                                    <p className="text-xs text-gray-400 mt-1">Run a background job on every new PDF upload.</p>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input 
                                        type="checkbox" 
                                        className="sr-only peer"
                                        checked={data.ai_enabled === '1'}
                                        onChange={(e) => setData('ai_enabled', e.target.checked ? '1' : '0')}
                                    />
                                    <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-500"></div>
                                </label>
                            </div>

                            {data.ai_enabled === '1' && (
                                <div className="space-y-5 p-5 rounded-lg border border-white/10 bg-black/20">
                                    
                                    {/* Provider Selection */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-300 mb-1">AI Provider</label>
                                        <select
                                            className="w-full bg-[#16161f] border border-white/10 text-white rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2.5"
                                            value={data.ai_provider}
                                            onChange={(e) => handleProviderChange(e.target.value)}
                                        >
                                            <option value="openai">OpenAI</option>
                                            <option value="gemini">Google Gemini</option>
                                            <option value="anthropic">Anthropic Claude</option>
                                            <option value="ollama">Ollama (Local)</option>
                                            <option value="custom">Custom / OpenRouter</option>
                                        </select>
                                    </div>

                                    {data.ai_provider === 'ollama' && (
                                        <p className="text-xs text-gray-400 -mt-2">
                                            Runs on your machine via Ollama. No API key needed. Use <code className="text-gray-300">ollama list</code> for model names.
                                        </p>
                                    )}

                                    {/* Base URL */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-300 mb-1">
                                            API Base URL
                                            {data.ai_provider !== 'ollama' && (
                                                <span className="text-gray-500 text-xs font-normal"> (Optional, for custom/proxies)</span>
                                            )}
                                        </label>
                                        <input
                                            type="url"
                                            className="w-full bg-[#16161f] border border-white/10 text-white rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2.5 placeholder-gray-600"
                                            placeholder={data.ai_provider === 'ollama' ? 'http://127.0.0.1:11434/v1' : 'https://api.openai.com/v1'}
                                            value={data.ai_base_url}
                                            onChange={(e) => setData('ai_base_url', e.target.value)}
                                        />
                                        {errors.ai_base_url && <p className="text-red-500 text-xs mt-1">{errors.ai_base_url}</p>}
                                    </div>

                                    {/* Model Name */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-300 mb-1">Model Name</label>
                                        <input
                                            type="text"
                                            className="w-full bg-[#16161f] border border-white/10 text-white rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2.5"
                                            placeholder={data.ai_provider === 'ollama' ? 'gemma4:e4b' : 'gpt-4o, gemini-1.5-pro, etc.'}
                                            value={data.ai_model}
                                            onChange={(e) => setData('ai_model', e.target.value)}
                                        />
                                    </div>

                                    {/* API Key */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-300 mb-1">
                                            API Token
                                            {data.ai_provider === 'ollama' && (
                                                <span className="text-gray-500 text-xs font-normal"> (Not required for Ollama)</span>
                                            )}
                                        </label>
                                        <input
                                            type="password"
                                            className="w-full bg-[#16161f] border border-white/10 text-white rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2.5"
                                            placeholder={data.ai_provider === 'ollama' ? 'Leave blank for local Ollama' : 'Leave blank to keep existing token'}
                                            value={data.ai_api_key}
                                            onChange={(e) => setData('ai_api_key', e.target.value)}
                                            disabled={data.ai_provider === 'ollama'}
                                        />
                                        {data.ai_provider !== 'ollama' && (
                                            <p className="text-xs text-gray-500 mt-1">If a token is already set, you'll see ********. Enter a new token to override it.</p>
                                        )}
                                    </div>

                                    {testResult && (
                                        <div
                                            className={`rounded-lg border p-4 text-sm ${
                                                testResult.success
                                                    ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-200'
                                                    : 'border-red-500/30 bg-red-500/10 text-red-200'
                                            }`}
                                        >
                                            <p className="font-medium">{testResult.message}</p>
                                            {testResult.response && (
                                                <p className="mt-2 text-xs text-white/70">
                                                    Model replied: <span className="text-white">{testResult.response}</span>
                                                </p>
                                            )}
                                            {typeof testResult.latency_ms === 'number' && (
                                                <p className="mt-1 text-xs text-white/50">
                                                    Response time: {testResult.latency_ms}ms
                                                </p>
                                            )}
                                        </div>
                                    )}
                                </div>
                            )}

                            <div className="flex items-center justify-end gap-3">
                                {data.ai_enabled === '1' && (
                                    <button
                                        type="button"
                                        onClick={runTest}
                                        disabled={testing || processing}
                                        className="px-5 py-2.5 bg-white/5 border border-white/15 rounded-md font-semibold text-xs text-gray-200 uppercase tracking-widest hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white/20 focus:ring-offset-2 focus:ring-offset-gray-800 transition ease-in-out duration-150 disabled:opacity-50"
                                    >
                                        {testing ? 'Testing...' : 'Test Connection'}
                                    </button>
                                )}
                                <button
                                    type="submit"
                                    disabled={processing || testing}
                                    className="px-5 py-2.5 bg-blue-600 border border-transparent rounded-md font-semibold text-xs text-white uppercase tracking-widest hover:bg-blue-500 focus:bg-blue-500 active:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-800 transition ease-in-out duration-150 disabled:opacity-50"
                                >
                                    {processing ? 'Saving...' : 'Save Settings'}
                                </button>
                            </div>
                        </form>

                    </div>
                </div>
            </div>
        </ComicLayout>
    );
}
