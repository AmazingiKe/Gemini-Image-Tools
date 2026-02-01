import { useState, useCallback, useEffect, useRef } from 'react';
import { Excalidraw } from '@excalidraw/excalidraw';
import type { ExcalidrawImperativeAPI } from '@excalidraw/excalidraw/types';
import '@excalidraw/excalidraw/index.css';
import { Download, Upload, Trash2, Send, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import axios from 'axios';

interface CanvasPageProps {
  isDark: boolean;
}

export function CanvasPage({ isDark }: CanvasPageProps) {
  const [excalidrawAPI, setExcalidrawAPI] = useState<ExcalidrawImperativeAPI | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 导出画布为图片
  const exportCanvas = useCallback(async () => {
    if (!excalidrawAPI) return;

    try {
      const elements = excalidrawAPI.getSceneElements();
      if (elements.length === 0) {
        toast.error('画布为空，无法导出');
        return;
      }

      const blob = await excalidrawAPI.exportToBlob({
        mimeType: 'image/png',
        quality: 1,
      });

      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `canvas-${Date.now()}.png`;
      link.click();
      URL.revokeObjectURL(url);
      toast.success('画布已导出');
    } catch (error) {
      toast.error('导出失败');
    }
  }, [excalidrawAPI]);

  // 清空画布
  const clearCanvas = useCallback(() => {
    if (!excalidrawAPI) return;

    if (window.confirm('确定要清空画布吗？')) {
      excalidrawAPI.resetScene();
      toast.success('画布已清空');
    }
  }, [excalidrawAPI]);

  // 将画布内容作为参考图发送到生成器
  const sendToGenerator = useCallback(async () => {
    if (!excalidrawAPI) return;

    try {
      const elements = excalidrawAPI.getSceneElements();
      if (elements.length === 0) {
        toast.error('画布为空');
        return;
      }

      const blob = await excalidrawAPI.exportToBlob({
        mimeType: 'image/png',
        quality: 0.9,
      });

      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        // 存储到 localStorage，让生成器页面读取
        localStorage.setItem('canvas_reference_image', base64);
        localStorage.setItem('canvas_reference_timestamp', Date.now().toString());
        toast.success('已添加到参考图，请前往工作台使用');
      };
      reader.readAsDataURL(blob);
    } catch (error) {
      toast.error('发送失败');
    }
  }, [excalidrawAPI]);

  // 导入图片到画布
  const importImage = useCallback(async (file: File) => {
    if (!excalidrawAPI) return;

    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const dataUrl = e.target?.result as string;

        // 创建图片获取尺寸
        const img = new Image();
        img.onload = () => {
          const maxSize = 800;
          let width = img.width;
          let height = img.height;

          if (width > maxSize || height > maxSize) {
            const scale = maxSize / Math.max(width, height);
            width *= scale;
            height *= scale;
          }

          const fileId = `file-${Date.now()}`;

          // 添加文件到 Excalidraw
          excalidrawAPI.addFiles([{
            id: fileId,
            dataURL: dataUrl,
            mimeType: file.type as any,
            created: Date.now(),
          }]);

          // 获取当前视图中心
          const appState = excalidrawAPI.getAppState();
          const centerX = appState.scrollX + appState.width / 2 / appState.zoom.value - width / 2;
          const centerY = appState.scrollY + appState.height / 2 / appState.zoom.value - height / 2;

          // 创建图片元素
          const imageElement = {
            type: 'image' as const,
            id: `image-${Date.now()}`,
            x: centerX,
            y: centerY,
            width,
            height,
            fileId,
            status: 'saved' as const,
            scale: [1, 1] as [number, number],
            angle: 0,
            strokeColor: 'transparent',
            backgroundColor: 'transparent',
            fillStyle: 'solid' as const,
            strokeWidth: 0,
            strokeStyle: 'solid' as const,
            roughness: 0,
            opacity: 100,
            groupIds: [],
            roundness: null,
            seed: Math.floor(Math.random() * 100000),
            version: 1,
            versionNonce: Math.floor(Math.random() * 100000),
            isDeleted: false,
            boundElements: null,
            updated: Date.now(),
            link: null,
            locked: false,
          };

          const currentElements = excalidrawAPI.getSceneElements();
          excalidrawAPI.updateScene({
            elements: [...currentElements, imageElement as any],
          });

          toast.success('图片已导入');
        };
        img.src = dataUrl;
      };
      reader.readAsDataURL(file);
    } catch (error) {
      toast.error('导入失败');
    }
  }, [excalidrawAPI]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      importImage(file);
    }
    e.target.value = '';
  };

  // 拖拽上传
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files);
    const imageFile = files.find(f => f.type.startsWith('image/'));
    if (imageFile) {
      importImage(imageFile);
    }
  }, [importImage]);

  return (
    <div
      className="flex-1 flex flex-col h-[calc(100vh-48px)] relative"
      onDrop={handleDrop}
      onDragOver={(e) => e.preventDefault()}
    >
      {/* 工具栏 */}
      <div className="absolute top-4 right-4 z-50 flex gap-2">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="hidden"
        />

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => fileInputRef.current?.click()}
          className="p-3 bg-white dark:bg-[#1d1d1f] rounded-xl shadow-lg border border-gray-100 dark:border-white/10 text-gray-600 dark:text-gray-400 hover:text-blue-500 transition-colors"
          title="导入图片"
        >
          <Upload className="w-5 h-5" />
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={exportCanvas}
          className="p-3 bg-white dark:bg-[#1d1d1f] rounded-xl shadow-lg border border-gray-100 dark:border-white/10 text-gray-600 dark:text-gray-400 hover:text-green-500 transition-colors"
          title="导出画布"
        >
          <Download className="w-5 h-5" />
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={sendToGenerator}
          className="p-3 bg-black dark:bg-white text-white dark:text-black rounded-xl shadow-lg hover:opacity-90 transition-opacity flex items-center gap-2"
          title="发送到生成器"
        >
          <Send className="w-5 h-5" />
          <span className="text-xs font-bold hidden sm:inline">用于生成</span>
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={clearCanvas}
          className="p-3 bg-white dark:bg-[#1d1d1f] rounded-xl shadow-lg border border-gray-100 dark:border-white/10 text-gray-600 dark:text-gray-400 hover:text-red-500 transition-colors"
          title="清空画布"
        >
          <Trash2 className="w-5 h-5" />
        </motion.button>
      </div>

      {/* 提示信息 */}
      <div className="absolute bottom-4 left-4 z-50 bg-white/90 dark:bg-[#1d1d1f]/90 backdrop-blur-xl px-4 py-2 rounded-xl shadow-lg border border-gray-100 dark:border-white/10">
        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
          Powered by <a href="https://github.com/ArtisanLabs/Jaaz" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">Jaaz</a> & Excalidraw
        </p>
      </div>

      {/* Excalidraw 画布 */}
      <div className="flex-1 w-full">
        <Excalidraw
          theme={isDark ? 'dark' : 'light'}
          excalidrawAPI={(api) => setExcalidrawAPI(api)}
          UIOptions={{
            canvasActions: {
              loadScene: true,
              saveToActiveFile: false,
              toggleTheme: false,
              clearCanvas: false,
            },
          }}
          viewModeEnabled={false}
          zenModeEnabled={false}
          gridModeEnabled={false}
        />
      </div>

      <style>{`
        .excalidraw {
          --color-primary: ${isDark ? '#fff' : '#000'};
          --color-primary-darker: ${isDark ? '#e5e5e5' : '#1a1a1a'};
          --color-primary-darkest: ${isDark ? '#ccc' : '#333'};
          height: 100% !important;
        }
        .excalidraw .App-menu_top {
          left: 50% !important;
          transform: translateX(-50%) !important;
        }
      `}</style>
    </div>
  );
}
