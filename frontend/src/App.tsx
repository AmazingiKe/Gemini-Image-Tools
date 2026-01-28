import { useState, useEffect } from 'react';
import { 
  Send, 
  Image as ImageIcon, 
  Settings, 
  Loader2, 
  Download, 
  Trash2, 
  Sliders, 
  History, 
  LayoutDashboard,
  ExternalLink,
  ChevronRight
} from 'lucide-react';
import axios from 'axios';
import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router-dom';

// --- Types ---
interface Task {
  id: string;
  prompt: string;
  status: 'pending' | 'generating' | 'completed' | 'failed';
  progress: number;
  resultUrl?: string;
  error?: string;
  timestamp: number;
}

interface AppConfig {
  gemini_proxy_url: string;
  fallback_proxy_url: string | null;
  api_key: string;
  admin_token: string;
  storage_path: string;
  port: number;
  timeout: number;
  retry_limit: number;
}

interface GenerationGroup {
  prompt: string;
  timestamp: number;
  images: string[];
}

// --- Components ---

function GeneratorPage({ 
  tasks, 
  setTasks, 
  prompt, 
  setPrompt, 
  model, 
  setModel, 
  parallelCount, 
  setParallelCount, 
  baseImage, 
  setBaseImage, 
  startGeneration 
}: any) {
  return (
    <>
      {/* Main Task Area */}
      <main className="flex-1 p-8 overflow-y-auto">
        <div className="max-w-[1600px] mx-auto">
          {tasks.length === 0 ? (
            <div className="h-[60vh] flex flex-col items-center justify-center">
              <div className="relative mb-8">
                <div className="absolute -inset-10 bg-blue-100 rounded-full blur-3xl opacity-20 animate-pulse"></div>
                <div className="w-24 h-24 bg-white rounded-3xl shadow-2xl flex items-center justify-center relative z-10 border border-gray-100">
                  <ImageIcon className="w-10 h-10 text-black opacity-80" />
                </div>
              </div>
              <h2 className="text-3xl font-bold tracking-tight text-black mb-3">开启你的创作</h2>
              <p className="text-gray-400 text-center max-w-sm font-medium leading-relaxed">
                在下方输入您的创意描述，Gemini 将为您捕捉瞬间灵感
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-8 animate-in fade-in duration-700">
              {tasks.map((task: Task) => (
                <div key={task.id} className="bg-white rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 overflow-hidden flex flex-col group hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-all duration-500 hover:-translate-y-1">
                  <div className="aspect-square bg-[#f5f5f7] relative">
                    {task.status === 'completed' && task.resultUrl ? (
                      <>
                        <img src={task.resultUrl} alt={task.prompt} className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3 backdrop-blur-[2px]">
                          <a 
                            href={task.resultUrl} 
                            target="_blank"
                            rel="noreferrer"
                            className="p-3 bg-white/90 backdrop-blur rounded-full text-black hover:bg-white transition-all shadow-xl hover:scale-110"
                          >
                            <ExternalLink className="w-5 h-5" />
                          </a>
                          <a 
                            href={task.resultUrl} 
                            download 
                            className="p-3 bg-black text-white rounded-full hover:bg-gray-800 transition-all shadow-xl hover:scale-110"
                          >
                            <Download className="w-5 h-5" />
                          </a>
                        </div>
                      </>
                    ) : task.status === 'failed' ? (
                      <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center">
                        <div className="bg-red-50 p-4 rounded-2xl mb-4">
                          <Trash2 className="w-8 h-8 text-red-400" />
                        </div>
                        <p className="text-sm text-red-500 font-bold mb-2">生成失败</p>
                        <div className="text-[10px] text-gray-400 bg-gray-50 p-3 rounded-xl w-full line-clamp-4 border border-gray-100 font-mono">
                          {task.error}
                        </div>
                      </div>
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center p-10">
                        <div className="relative mb-8">
                          <Loader2 className="w-14 h-14 text-black animate-spin opacity-20" />
                          <div className="absolute inset-0 flex items-center justify-center">
                             <span className="text-[10px] font-black">{Math.round(task.progress)}%</span>
                          </div>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-1 overflow-hidden">
                          <div 
                            className="bg-black h-1 rounded-full transition-all duration-1000 ease-in-out" 
                            style={{ width: `${task.progress}%` }}
                          ></div>
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="p-6 flex-1 flex flex-col bg-white">
                    <p className="text-sm text-[#1d1d1f] line-clamp-2 leading-relaxed font-semibold mb-4 opacity-90">
                      {task.prompt}
                    </p>
                    <div className="mt-auto pt-4 flex justify-between items-center border-t border-gray-50">
                      <span className="text-[10px] font-bold text-gray-300 tracking-wider">
                        {new Date(task.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      <span className={`text-[10px] px-3 py-1 rounded-full font-black uppercase tracking-widest ${
                        task.status === 'completed' ? 'bg-green-50 text-green-600' :
                        task.status === 'failed' ? 'bg-red-50 text-red-600' :
                        'bg-gray-100 text-gray-400 animate-pulse'
                      }`}>
                        {task.status === 'completed' ? 'Done' :
                         task.status === 'failed' ? 'Error' :
                         'Processing'}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Floating Dock Style Input */}
      <footer className="p-8 sticky bottom-0 z-20">
        <div className="max-w-4xl mx-auto">
          {baseImage && (
            <div className="mb-4 flex items-center gap-4 bg-white/70 backdrop-blur-2xl p-3 rounded-[1.5rem] border border-white/50 w-fit shadow-2xl animate-in slide-in-from-bottom-4 duration-500">
              <div className="relative">
                <img src={baseImage} className="w-16 h-16 object-cover rounded-xl shadow-inner" alt="Preview" />
                <button 
                  onClick={() => setBaseImage(null)}
                  className="absolute -top-2 -right-2 w-6 h-6 bg-black text-white rounded-full hover:bg-gray-800 transition-colors shadow-lg flex items-center justify-center"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
              <div className="pr-4">
                <p className="text-xs font-black uppercase tracking-widest text-black">参考图已锁定</p>
                <p className="text-[10px] text-gray-400 mt-0.5">Reference Locked</p>
              </div>
            </div>
          )}
          
          <div className="bg-white/70 backdrop-blur-2xl p-2 rounded-[2rem] border border-white/50 shadow-[0_20px_50px_rgba(0,0,0,0.1)] flex items-center gap-2 group transition-all duration-500 focus-within:shadow-[0_20px_50px_rgba(0,0,0,0.15)] focus-within:bg-white/90">
            <label className="cursor-pointer p-4 hover:bg-gray-100 rounded-2xl transition-all text-gray-400 hover:text-black">
              <ImageIcon className="w-6 h-6" />
              <input 
                type="file" 
                className="hidden" 
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    const reader = new FileReader();
                    reader.onloadend = () => setBaseImage(reader.result as string);
                    reader.readAsDataURL(file);
                  }
                }}
              />
            </label>
            
            <input 
              type="text" 
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && startGeneration()}
              placeholder="描述您的创意..."
              className="flex-1 bg-transparent border-none focus:ring-0 text-[#1d1d1f] placeholder-gray-300 py-4 px-2 text-lg font-medium"
            />
            
            <div className="hidden md:flex items-center gap-1 bg-[#f5f5f7] p-1.5 rounded-2xl border border-gray-200/50">
              <select 
                value={model}
                onChange={(e) => setModel(e.target.value)}
                className="bg-transparent text-[11px] font-black uppercase tracking-tighter text-gray-500 border-none focus:ring-0 cursor-pointer px-3"
              >
                <option value="gemini-3-pro-image">Gemini 3 Pro</option>
                <option value="dall-e-3">DALL-E 3</option>
              </select>
              <div className="w-[1px] h-3 bg-gray-300 mx-1"></div>
              <select 
                value={parallelCount}
                onChange={(e) => setParallelCount(Number(e.target.value))}
                className="bg-transparent text-[11px] font-black text-gray-500 border-none focus:ring-0 cursor-pointer px-3"
              >
                {[1, 2, 4, 8, 16].map(n => (
                  <option key={n} value={n}>{n} 张</option>
                ))}
              </select>
            </div>

            <button 
              onClick={startGeneration}
              disabled={!prompt.trim()}
              className="bg-black text-white hover:bg-[#1d1d1f] disabled:bg-gray-100 disabled:text-gray-300 p-4 rounded-[1.5rem] font-bold transition-all px-8 shadow-xl hover:shadow-gray-200 active:scale-95"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        </div>
      </footer>
    </>
  );
}
    </>
  );
}

function HistoryPage({ history, onClear }: { history: GenerationGroup[], onClear: () => void }) {
  if (history.length === 0) {
// ...
    return (
      <main className="flex-1 p-8 flex flex-col items-center justify-center text-gray-400">
        <History className="w-16 h-16 mb-4 opacity-20" />
        <p className="text-lg">暂无生成历史</p>
      </main>
    );
  }

  return (
    <main className="flex-1 p-8 overflow-y-auto max-w-7xl mx-auto w-full">
      <div className="flex items-center gap-3 mb-8">
        <div className="bg-blue-600 p-2 rounded-lg">
          <History className="text-white w-6 h-6" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-gray-800">创作历史库</h2>
          <p className="text-sm text-gray-400">所有已成功生成的创意结晶</p>
        </div>
        <button 
          onClick={onClear}
          className="ml-auto flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 rounded-xl text-xs font-bold hover:bg-red-100 transition-colors border border-red-100"
        >
          <Trash2 className="w-4 h-4" />
          清空历史
        </button>
      </div>

      <div className="space-y-12">
        {history.map((group, idx) => (
          <div key={idx} className="group">
            <div className="flex items-center gap-4 mb-4">
              <div className="h-px flex-1 bg-gray-100"></div>
              <span className="text-xs font-bold text-gray-400 bg-gray-50 px-3 py-1 rounded-full border border-gray-100">
                {new Date(group.timestamp).toLocaleString()}
              </span>
              <div className="h-px flex-1 bg-gray-100"></div>
            </div>
            
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 hover:border-blue-100 transition-colors">
              <div className="mb-6 flex justify-between items-start gap-4">
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-gray-800 mb-1 flex items-center gap-2">
                    <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                    {group.prompt}
                  </h3>
                  <p className="text-sm text-gray-400">共生成 {group.images.length} 张图片</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {group.images.map((url, imgIdx) => (
                  <div key={imgIdx} className="aspect-square rounded-2xl overflow-hidden relative group/img cursor-pointer border border-gray-50">
                    <img src={url} alt={group.prompt} className="w-full h-full object-cover group-hover/img:scale-110 transition-transform duration-500" />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      <a href={url} download className="p-2 bg-white rounded-full text-gray-800 hover:scale-110 transition-transform shadow-lg">
                        <Download className="w-4 h-4" />
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}

// --- Main App Component ---

function AppContent() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [history, setHistory] = useState<GenerationGroup[]>([]);
  const [prompt, setPrompt] = useState('');
  const [model, setModel] = useState('gemini-3-pro-image');
  const [parallelCount, setParallelCount] = useState(4);
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [config, setConfig] = useState<AppConfig | null>(null);
  const [baseImage, setBaseImage] = useState<string | null>(null);
  const location = useLocation();

  useEffect(() => {
    fetchConfig();
    fetchHistory();
  }, []);

  const fetchConfig = async () => {
    try {
      const response = await axios.get('/api/config');
      setConfig(response.data);
    } catch (error) {
      console.error('获取配置失败:', error);
    }
  };

  const fetchHistory = async () => {
    try {
      const response = await axios.get('/api/history');
      setHistory(response.data);
    } catch (error) {
      console.error('获取历史失败:', error);
    }
  };

  const handleClearHistory = async () => {
    if (window.confirm('确定要清空所有创作历史吗？')) {
      try {
        await axios.delete('/api/history');
        setHistory([]);
      } catch (error) {
        alert('清空历史失败');
      }
    }
  };

  const handleUpdateConfig = async (newConfig: AppConfig) => {
    try {
      await axios.post('/api/config', newConfig);
      setConfig(newConfig);
      setIsConfigOpen(false);
    } catch (error) {
      alert('更新配置失败');
    }
  };

  const startGeneration = async () => {
    if (!prompt.trim()) return;

    const timestamp = Date.now();
    const newTasks: Task[] = Array.from({ length: parallelCount }).map(() => ({
      id: Math.random().toString(36).substr(2, 9),
      prompt: prompt,
      status: 'pending',
      progress: 0,
      timestamp: timestamp
    }));

    setTasks(prev => [...newTasks, ...prev]);
    const currentPrompt = prompt;
    const currentImage = baseImage;
    setPrompt('');
    setBaseImage(null);

    // Track results to add to history when finished
    const results: string[] = [];
    let finishedCount = 0;

    newTasks.forEach(task => {
      executeTask(task, currentPrompt, currentImage, model, (url) => {
        finishedCount++;
        if (url) results.push(url);
        
        // When all tasks in this batch are done, refresh history from backend
        if (finishedCount === parallelCount) {
          fetchHistory();
        }
      });
    });
  };

  const executeTask = async (
    task: Task, 
    taskPrompt: string, 
    taskImage: string | null, 
    taskModel: string,
    onFinish: (url?: string) => void
  ) => {
    setTasks(prev => prev.map(t => t.id === task.id ? { ...t, status: 'generating', progress: 10 } : t));

    try {
      const progressInterval = setInterval(() => {
        setTasks(prev => prev.map(t => {
          if (t.id === task.id && t.status === 'generating' && t.progress < 90) {
            return { ...t, progress: t.progress + Math.random() * 3 };
          }
          return t;
        }));
      }, 1500);

      const response = await axios.post('/v1/images/generations', {
        prompt: taskPrompt,
        image: taskImage,
        model: taskModel,
        n: 1,
        size: "1024x1024"
      });

      clearInterval(progressInterval);

      const imageUrl = response.data.data[0].url;
      setTasks(prev => prev.map(t => t.id === task.id ? { 
        ...t, 
        status: 'completed', 
        progress: 100, 
        resultUrl: imageUrl 
      } : t));
      onFinish(imageUrl);
    } catch (error: any) {
      setTasks(prev => prev.map(t => t.id === task.id ? { 
        ...t, 
        status: 'failed', 
        error: error.response?.data || error.message 
      } : t));
      onFinish();
    }
  };

  const clearTasks = () => setTasks([]);

  return (
    <div className="min-h-screen bg-[#f5f5f7] flex flex-col font-sans text-[#1d1d1f] selection:bg-blue-100">
      {/* Apple Style Top Navigation */}
      <nav className="bg-white/80 backdrop-blur-xl border-b border-gray-200/50 px-6 h-14 flex justify-between items-center sticky top-0 z-30 transition-all">
        {/* Left Section: Brand */}
        <div className="flex items-center gap-3 w-1/4">
          <Link to="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <div className="bg-black p-1.5 rounded-lg shadow-sm">
              <ImageIcon className="text-white w-4 h-4" />
            </div>
            <span className="font-semibold tracking-tight text-sm">Gemini Factory</span>
          </Link>
        </div>

        {/* Center Section: Navigation Segmented Control */}
        <div className="flex items-center bg-[#f5f5f7] p-1 rounded-xl border border-gray-200/50 min-w-[200px] h-9">
          <Link 
            to="/" 
            className={`flex-1 flex items-center justify-center gap-2 px-4 rounded-lg text-xs font-bold transition-all duration-200 h-full ${
              location.pathname === '/' ? 'bg-white shadow-sm text-black' : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            工作台
          </Link>
          <Link 
            to="/history" 
            className={`flex-1 flex items-center justify-center gap-2 px-4 rounded-lg text-xs font-bold transition-all duration-200 h-full ${
              location.pathname === '/history' ? 'bg-white shadow-sm text-black' : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            历史库
          </Link>
        </div>

        {/* Right Section: Actions */}
        <div className="flex items-center justify-end gap-3 w-1/4">
          <button 
            onClick={() => setIsConfigOpen(true)}
            className="p-2 text-gray-500 hover:text-black hover:bg-gray-100 rounded-full transition-all"
            title="系统设置"
          >
            <Settings className="w-5 h-5" />
          </button>
        </div>
      </nav>

      <div className="flex-1 flex flex-col relative">
        <Routes>
          <Route path="/" element={
            <GeneratorPage 
              tasks={tasks}
              setTasks={setTasks}
              prompt={prompt}
              setPrompt={setPrompt}
              model={model}
              setModel={setModel}
              parallelCount={parallelCount}
              setParallelCount={setParallelCount}
              baseImage={baseImage}
              setBaseImage={setBaseImage}
              startGeneration={startGeneration}
            />
          } />
                  <Route path="/history" element={<HistoryPage history={history} onClear={handleClearHistory} />} />
                </Routes>
          
      </div>

      {/* Config Modal */}
      {isConfigOpen && config && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-md flex items-center justify-center z-50 p-6 animate-in fade-in duration-300">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-xl overflow-hidden border border-gray-100 scale-in-center">
            <div className="px-8 py-6 border-b border-gray-50 flex justify-between items-center bg-gray-50/50">
              <div>
                <h2 className="text-xl font-bold text-gray-800">系统核心配置</h2>
                <p className="text-xs text-gray-400 mt-1 uppercase tracking-widest">System Core Settings</p>
              </div>
              <button 
                onClick={() => setIsConfigOpen(false)} 
                className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-200 text-gray-400 transition-colors"
              >
                &times;
              </button>
            </div>
            <div className="p-8 space-y-6">
              <div className="space-y-4">
                <div className="group">
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 px-1">Gemini 代理端点</label>
                  <input 
                    type="text" 
                    className="w-full bg-gray-50 border-2 border-gray-50 rounded-2xl px-5 py-3 text-sm font-medium focus:bg-white focus:border-blue-500 transition-all outline-none"
                    value={config.gemini_proxy_url}
                    onChange={(e) => setConfig({...config, gemini_proxy_url: e.target.value})}
                  />
                </div>
                <div className="group">
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 px-1">备用代理端点 (可选)</label>
                  <input 
                    type="text" 
                    className="w-full bg-gray-50 border-2 border-gray-50 rounded-2xl px-5 py-3 text-sm font-medium focus:bg-white focus:border-blue-500 transition-all outline-none"
                    value={config.fallback_proxy_url || ''}
                    onChange={(e) => setConfig({...config, fallback_proxy_url: e.target.value || null})}
                    placeholder="None"
                  />
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="col-span-2">
                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 px-1">API 授权密钥</label>
                    <input 
                      type="password" 
                      className="w-full bg-gray-50 border-2 border-gray-50 rounded-2xl px-5 py-3 text-sm font-medium focus:bg-white focus:border-blue-500 transition-all outline-none"
                      value={config.api_key}
                      onChange={(e) => setConfig({...config, api_key: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 px-1">监听端口</label>
                    <input 
                      type="number" 
                      className="w-full bg-gray-50 border-2 border-gray-50 rounded-2xl px-5 py-3 text-sm font-medium focus:bg-white focus:border-blue-500 transition-all outline-none"
                      value={config.port}
                      onChange={(e) => setConfig({...config, port: Number(e.target.value)})}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 px-1">本地图像存储根路径</label>
                  <input 
                    type="text" 
                    className="w-full bg-gray-50 border-2 border-gray-50 rounded-2xl px-5 py-3 text-sm font-medium focus:bg-white focus:border-blue-500 transition-all outline-none"
                    value={config.storage_path}
                    onChange={(e) => setConfig({...config, storage_path: e.target.value})}
                  />
                </div>

                <div className="pt-4 border-t border-gray-100">
                  <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                    <Sliders className="w-3 h-3" /> 高级请求控制 (Advanced)
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 px-1">单次请求超时 (秒)</label>
                      <input 
                        type="number" 
                        className="w-full bg-gray-50 border-2 border-gray-50 rounded-2xl px-5 py-3 text-sm font-medium focus:bg-white focus:border-blue-500 transition-all outline-none"
                        value={config.timeout}
                        onChange={(e) => setConfig({...config, timeout: Number(e.target.value)})}
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 px-1">最大重试次数</label>
                      <input 
                        type="number" 
                        className="w-full bg-gray-50 border-2 border-gray-50 rounded-2xl px-5 py-3 text-sm font-medium focus:bg-white focus:border-blue-500 transition-all outline-none"
                        value={config.retry_limit}
                        onChange={(e) => setConfig({...config, retry_limit: Number(e.target.value)})}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="px-8 py-6 bg-gray-50/50 flex justify-end gap-4 border-t border-gray-50">
              <button 
                onClick={() => setIsConfigOpen(false)}
                className="px-6 py-2 text-sm font-bold text-gray-400 hover:text-gray-600 transition-colors"
              >
                取消
              </button>
              <button 
                onClick={() => handleUpdateConfig(config)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-2 rounded-xl text-sm font-bold transition-all shadow-lg shadow-blue-100"
              >
                保存变更
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}

export default App;
