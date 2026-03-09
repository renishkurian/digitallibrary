import { useState } from 'react';
import { Head, useForm } from '@inertiajs/react';
import ComicLayout from '@/Layouts/ComicLayout';
import { toast } from 'react-hot-toast';

export default function Index({ auth, settings }) {
    const { data, setData, post, processing, errors } = useForm({
        ai_enabled: settings.ai_enabled || '0',
        ai_provider: settings.ai_provider || 'openai',
        ai_base_url: settings.ai_base_url || '',
        ai_api_key: settings.ai_api_key ? '********' : '',
        ai_model: settings.ai_model || 'gpt-4o',
    });

    const submit = (e) => {
        e.preventDefault();
        post(route('admin.settings.update'), {
            preserveScroll: true,
            onSuccess: () => toast.success('Settings saved successfully!'),
        });
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
                                            onChange={(e) => setData('ai_provider', e.target.value)}
                                        >
                                            <option value="openai">OpenAI</option>
                                            <option value="gemini">Google Gemini</option>
                                            <option value="anthropic">Anthropic Claude</option>
                                            <option value="custom">Custom / Local API</option>
                                        </select>
                                    </div>

                                    {/* Base URL */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-300 mb-1">API Base URL <span className="text-gray-500 text-xs font-normal">(Optional, for custom/proxies)</span></label>
                                        <input
                                            type="url"
                                            className="w-full bg-[#16161f] border border-white/10 text-white rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2.5 placeholder-gray-600"
                                            placeholder="https://api.openai.com/v1"
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
                                            placeholder="gpt-4o, gemini-1.5-pro, etc."
                                            value={data.ai_model}
                                            onChange={(e) => setData('ai_model', e.target.value)}
                                        />
                                    </div>

                                    {/* API Key */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-300 mb-1">API Token</label>
                                        <input
                                            type="password"
                                            className="w-full bg-[#16161f] border border-white/10 text-white rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2.5"
                                            placeholder="Leave blank to keep existing token"
                                            value={data.ai_api_key}
                                            onChange={(e) => setData('ai_api_key', e.target.value)}
                                        />
                                        <p className="text-xs text-gray-500 mt-1">If a token is already set, you'll see ********. Enter a new token to override it.</p>
                                    </div>

                                </div>
                            )}

                            <div className="flex items-center justify-end">
                                <button
                                    type="submit"
                                    disabled={processing}
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
