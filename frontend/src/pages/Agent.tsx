import React, { useState, useRef, useEffect } from 'react';
import { 
  Send, 
  User, 
  Bot, 
  Loader2, 
  Plus, 
  Trash2, 
  Sparkles,
  RefreshCw,
  X,
  Copy,
  ExternalLink
} from 'lucide-react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export function AgentPage() {
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Message[]>([
    { role: 'system', content: 'You are Gemini YOLO, a powerful AI assistant in YOLO Mode. You help users with creative tasks, brainstorming, and daring marketing ideas.' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = { role: 'user', content: input };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput('');
    setIsLoading(true);

    // Auto resize textarea
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }

    try {
      const response = await axios.post('/api/chat', {
        messages: newMessages.map(m => ({
          role: m.role,
          content: m.content
        })),
        model: 'gemini-3-flash'
      });

      const assistantContent = response.data.choices[0].message.content;
      setMessages(prev => [...prev, { role: 'assistant', content: assistantContent }]);
    } catch (error) {
      toast.error('发送失败，请检查后端服务及 API 配置');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const clearHistory = () => {
    if (window.confirm('确定要清空对话记录吗？')) {
      setMessages([
        { role: 'system', content: 'You are Gemini Jaaz, a powerful AI assistant focused on helping users with their creative tasks and marketing automation.' }
      ]);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <main className="flex-1 flex flex-col h-[calc(100vh-64px)] overflow-hidden">
      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto p-4 md:p-8 custom-scrollbar">
        <div className="max-w-4xl mx-auto space-y-6 pb-24">
          <AnimatePresence initial={false}>
            {messages.filter(m => m.role !== 'system').map((msg, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`flex gap-4 max-w-[85%] ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                  <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 shadow-sm ${
                    msg.role === 'user' 
                      ? 'bg-blue-500 text-white' 
                      : 'bg-white dark:bg-[#1d1d1f] text-gray-600 dark:text-gray-300 border border-gray-100 dark:border-white/5'
                  }`}>
                    {msg.role === 'user' ? <User className="w-5 h-5" /> : <Bot className="w-5 h-5" />}
                  </div>
                  <div className={`p-4 rounded-[1.5rem] shadow-[0_4px_20px_rgba(0,0,0,0.02)] border relative group/msg-content ${
                    msg.role === 'user'
                      ? 'bg-white dark:bg-[#1d1d1f] border-blue-500/10 text-gray-800 dark:text-gray-100'
                      : 'bg-white dark:bg-[#1d1d1f] border-gray-100 dark:border-white/5 text-gray-800 dark:text-gray-100'
                  }`}>
                    <div className="prose prose-sm dark:prose-invert max-w-none whitespace-pre-wrap leading-relaxed">
                      {msg.content}
                    </div>
                    {msg.role === 'assistant' && (
                      <div className="absolute top-2 right-2 opacity-0 group-hover/msg-content:opacity-100 transition-opacity flex gap-1">
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(msg.content);
                            toast.success('已复制到剪贴板');
                          }}
                          className="p-1.5 bg-gray-100 dark:bg-white/10 rounded-lg hover:bg-gray-200 dark:hover:bg-white/20 transition-all"
                          title="复制内容"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => {
                            localStorage.setItem('pending_prompt', msg.content);
                            navigate('/');
                            toast.success('已发送到工作台');
                          }}
                          className="p-1.5 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-all"
                          title="发送到工作台"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
          {isLoading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex justify-start"
            >
              <div className="flex gap-4">
                <div className="w-10 h-10 rounded-2xl bg-white dark:bg-[#1d1d1f] flex items-center justify-center border border-gray-100 dark:border-white/5">
                  <Bot className="w-5 h-5 text-blue-500 animate-pulse" />
                </div>
                <div className="bg-white dark:bg-[#1d1d1f] p-4 rounded-[1.5rem] border border-gray-100 dark:border-white/5 flex items-center gap-2">
                  <div className="flex gap-1">
                    <motion.div 
                      animate={{ scale: [1, 1.2, 1] }} 
                      transition={{ repeat: Infinity, duration: 1, delay: 0 }}
                      className="w-1.5 h-1.5 bg-blue-500 rounded-full" 
                    />
                    <motion.div 
                      animate={{ scale: [1, 1.2, 1] }} 
                      transition={{ repeat: Infinity, duration: 1, delay: 0.2 }}
                      className="w-1.5 h-1.5 bg-blue-500 rounded-full" 
                    />
                    <motion.div 
                      animate={{ scale: [1, 1.2, 1] }} 
                      transition={{ repeat: Infinity, duration: 1, delay: 0.4 }}
                      className="w-1.5 h-1.5 bg-blue-500 rounded-full" 
                    />
                  </div>
                </div>
              </div>
            </motion.div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Area */}
      <div className="p-4 md:p-8 bg-gradient-to-t from-[#f5f5f7] via-[#f5f5f7] to-transparent dark:from-black dark:via-black dark:to-transparent">
        <div className="max-w-3xl mx-auto">
          <div className="relative group">
            <div className="bg-white/80 dark:bg-[#1d1d1f]/80 backdrop-blur-3xl rounded-[2rem] border border-white/40 dark:border-white/10 shadow-[0_12px_40px_rgba(0,0,0,0.12)] p-2 flex flex-col gap-2 transition-all focus-within:ring-2 focus-within:ring-blue-500/20">
              <textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => {
                  setInput(e.target.value);
                  e.target.style.height = 'auto';
                  e.target.style.height = `${Math.min(e.target.scrollHeight, 200)}px`;
                }}
                onKeyDown={handleKeyDown}
                placeholder="询问 YOLO..."
                className="w-full bg-transparent border-none focus:ring-0 text-[#1d1d1f] dark:text-[#f5f5f7] py-3 px-4 text-sm font-medium outline-none placeholder:text-gray-400 resize-none max-h-[200px]"
                rows={1}
              />
              <div className="flex items-center justify-between px-2 pb-1">
                <div className="flex gap-2">
                  <button
                    onClick={clearHistory}
                    title="清空记录"
                    className="p-2 text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition-all rounded-xl hover:bg-gray-100 dark:hover:bg-white/5"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                  <button
                    className="p-2 text-gray-400 hover:text-blue-500 dark:hover:text-blue-400 transition-all rounded-xl hover:bg-gray-100 dark:hover:bg-white/5"
                  >
                    <Sparkles className="w-4 h-4" />
                  </button>
                </div>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleSend}
                  disabled={!input.trim() || isLoading}
                  className="bg-black dark:bg-white text-white dark:text-black p-2.5 rounded-2xl shadow-lg disabled:opacity-20 disabled:grayscale transition-all flex items-center justify-center"
                >
                  {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                </motion.button>
              </div>
            </div>
          </div>
          <p className="text-center mt-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest opacity-50">
            YOLO Mode Powered by Gemini-3-Flash
          </p>
        </div>
      </div>
    </main>
  );
}
