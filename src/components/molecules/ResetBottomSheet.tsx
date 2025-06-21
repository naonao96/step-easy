import React from 'react';
import { FaUndo, FaClock, FaCalendarDay, FaTrash } from 'react-icons/fa';

interface ResetBottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onReset: (resetType: 'session' | 'today' | 'total') => void;
  taskTitle: string;
}

export const ResetBottomSheet: React.FC<ResetBottomSheetProps> = ({
  isOpen,
  onClose,
  onReset,
  taskTitle
}) => {
  if (!isOpen) return null;

  const handleReset = (resetType: 'session' | 'today' | 'total') => {
    // 先にonResetを呼び出す（内部でonCloseも呼ばれる）
    onReset(resetType);
  };

  return (
    <>
      {/* オーバーレイ */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 z-50 transition-opacity"
        onClick={onClose}
      />
      
      {/* ボトムシート */}
      <div className="fixed bottom-0 left-0 right-0 bg-white rounded-t-3xl z-50 transform transition-transform duration-300 ease-out max-h-[85vh] overflow-y-auto">
        {/* ハンドル */}
        <div className="flex justify-center pt-4 pb-2">
          <div className="w-10 h-1 bg-gray-300 rounded-full"></div>
        </div>
        
        {/* ヘッダー */}
        <div className="px-6 pb-4">
          <h2 className="text-xl font-semibold text-gray-900 text-center">
            リセット範囲を選択
          </h2>
          <p className="text-sm text-gray-600 text-center mt-1">
            {taskTitle}
          </p>
        </div>
        
        {/* リセット選択肢 */}
        <div className="px-4 pb-safe-8">
          <div className="space-y-3">
            
            {/* セッションリセット */}
            <button
              onClick={() => handleReset('session')}
              className="w-full flex items-center gap-4 p-4 bg-gray-50 hover:bg-gray-100 rounded-2xl transition-colors active:scale-95 transform duration-150"
            >
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                {FaClock({ className: "w-6 h-6 text-blue-600" })}
              </div>
              <div className="flex-1 text-left">
                <div className="font-semibold text-gray-900">セッションのみ</div>
                <div className="text-sm text-gray-600">現在の実行時間のみリセット</div>
              </div>
            </button>
            
            {/* 今日累計リセット */}
            <button
              onClick={() => handleReset('today')}
              className="w-full flex items-center gap-4 p-4 bg-orange-50 hover:bg-orange-100 rounded-2xl transition-colors active:scale-95 transform duration-150"
            >
              <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                {FaCalendarDay({ className: "w-6 h-6 text-orange-600" })}
              </div>
              <div className="flex-1 text-left">
                <div className="font-semibold text-gray-900">今日累計</div>
                <div className="text-sm text-gray-600">今日分の累積時間をリセット</div>
              </div>
            </button>
            
            {/* 総累計リセット */}
            <button
              onClick={() => handleReset('total')}
              className="w-full flex items-center gap-4 p-4 bg-red-50 hover:bg-red-100 rounded-2xl transition-colors active:scale-95 transform duration-150"
            >
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                {FaTrash({ className: "w-6 h-6 text-red-600" })}
              </div>
              <div className="flex-1 text-left">
                <div className="font-semibold text-gray-900">総累計</div>
                <div className="text-sm text-gray-600">⚠️ 全期間の記録を完全削除</div>
              </div>
            </button>
            
          </div>
          
          {/* キャンセルボタン */}
          <button
            onClick={onClose}
            className="w-full mt-6 p-4 bg-gray-200 hover:bg-gray-300 rounded-2xl font-semibold text-gray-700 transition-colors active:scale-95 transform duration-150"
          >
            キャンセル
          </button>
        </div>
      </div>
    </>
  );
}; 