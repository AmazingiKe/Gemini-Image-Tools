import React, { useState, useEffect } from 'react';
import { Sliders, X } from 'lucide-react';
import { motion } from 'framer-motion';
import type { AppConfig } from '../types';

interface SettingsPageProps {
  config: AppConfig | null;
  onUpdateConfig: (newConfig: AppConfig) => Promise<void>;
}

export const SettingsPage: React.FC<SettingsPageProps> = ({ config, onUpdateConfig }) => {
  const [localConfig, setLocalConfig] = useState<AppConfig | null>(null);

  useEffect(() => {
    if (config) {
      setLocalConfig({ ...config });
    }
  }, [config]);

  if (!localConfig) return null;

  return (
    <main className="flex-1 p-8 overflow-y-auto max-w-2xl mx-auto w-full">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">系统设置</h2>
        <p className="text-sm text-gray-400 font-medium">Configure your system preferences</p>
      </div>

      <div className="bg-white dark:bg-[#1d1d1f] rounded-[2.5rem] p-8 shadow-[0_8px_30px_rgb(0,0,0,0.02)] border border-gray-50 dark:border-white/5 space-y-6">
        <div className="space-y-4">
          <div className="group">
            <label className="block text-[9px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-1.5 px-1">Gemini 代理端点</label>
            <input
              type="text"
              className="w-full bg-gray-50 dark:bg-black/40 border border-transparent rounded-xl px-4 py-3 text-sm font-bold focus:bg-white dark:focus:bg-black focus:border-blue-500 transition-all outline-none dark:text-white"
              value={localConfig.gemini_proxy_url}
              onChange={(e) => setLocalConfig({...localConfig, gemini_proxy_url: e.target.value})}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-[9px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-1.5 px-1">API 授权密钥</label>
              <input
                type="password"
                className="w-full bg-gray-50 dark:bg-black/40 border border-transparent rounded-xl px-4 py-3 text-sm font-bold focus:bg-white dark:focus:bg-black focus:border-blue-500 transition-all outline-none dark:text-white"
                value={localConfig.api_key}
                onChange={(e) => setLocalConfig({...localConfig, api_key: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-[9px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-1.5 px-1">监听端口</label>
              <input
                type="number"
                className="w-full bg-gray-50 dark:bg-black/40 border border-transparent rounded-xl px-4 py-3 text-sm font-bold focus:bg-white dark:focus:bg-black focus:border-blue-500 transition-all outline-none dark:text-white"
                value={localConfig.port}
                onChange={(e) => setLocalConfig({...localConfig, port: Number(e.target.value)})}
              />
            </div>
          </div>

          <div className="pt-6 border-t border-gray-100 dark:border-white/5">
            <div className="flex items-center gap-1.5 mb-4 text-blue-500">
              <Sliders className="w-4 h-4" />
              <h3 className="text-[10px] font-black uppercase tracking-[0.2em]">性能参数</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[9px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-1.5 px-1">请求超时 (秒)</label>
                <input
                  type="number"
                  className="w-full bg-gray-50 dark:bg-black/40 border border-transparent rounded-xl px-4 py-3 text-sm font-bold focus:bg-white dark:focus:bg-black focus:border-blue-500 transition-all outline-none dark:text-white"
                  value={localConfig.timeout}
                  onChange={(e) => setLocalConfig({...localConfig, timeout: Number(e.target.value)})}
                />
              </div>
              <div>
                <label className="block text-[9px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-1.5 px-1">最大重试</label>
                <input
                  type="number"
                  className="w-full bg-gray-50 dark:bg-black/40 border border-transparent rounded-xl px-4 py-3 text-sm font-bold focus:bg-white dark:focus:bg-black focus:border-blue-500 transition-all outline-none dark:text-white"
                  value={localConfig.retry_limit}
                  onChange={(e) => setLocalConfig({...localConfig, retry_limit: Number(e.target.value)})}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="pt-6 flex justify-end">
          <button
            onClick={() => onUpdateConfig(localConfig)}
            className="bg-black dark:bg-white text-white dark:text-black px-8 py-3 rounded-2xl text-[12px] font-black uppercase tracking-widest transition-all shadow-xl hover:opacity-90 active:scale-95 w-full md:w-auto"
          >
            保存设置
          </button>
        </div>
      </div>
    </main>
  );
};
