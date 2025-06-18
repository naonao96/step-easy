import React, { useState } from 'react';
import { FaCheck, FaTimes, FaSpinner, FaExclamationTriangle } from 'react-icons/fa';
import { Button } from '@/components/atoms/Button';
import { Task } from '@/stores/taskStore';

interface GuestMigrationModalProps {
  isOpen: boolean;
  guestTasks: Task[];
  onConfirm: () => Promise<void>;
  onCancel: () => void;
  onComplete: () => void;
  isLoading?: boolean;
  error?: string | null;
}

export const GuestMigrationModal: React.FC<GuestMigrationModalProps> = ({
  isOpen,
  guestTasks,
  onConfirm,
  onCancel,
  onComplete,
  isLoading = false,
  error = null
}) => {
  const [step, setStep] = useState<'confirm' | 'migrating' | 'success' | 'error'>('confirm');

  if (!isOpen) return null;

  const handleConfirm = async () => {
    setStep('migrating');
    try {
      await onConfirm();
      setStep('success');
      setTimeout(() => {
        onComplete();
      }, 2000);
    } catch (err) {
      setStep('error');
    }
  };

  const handleCancel = () => {
    onCancel();
    setStep('confirm');
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* 確認ステップ */}
        {step === 'confirm' && (
          <>
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900 mb-2">
                ゲストタスクを引き継ぎますか？
              </h2>
              <p className="text-gray-600 text-sm">
                ゲストとして作成した{guestTasks.length}個のタスクをアカウントに移行できます。
              </p>
            </div>

            <div className="p-6">
              <div className="mb-4">
                <h3 className="font-semibold text-gray-900 mb-2">移行されるタスク:</h3>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {guestTasks.map((task, index) => (
                    <div key={index} className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                      <div className={`w-3 h-3 rounded ${
                        task.status === 'done' ? 'bg-green-500' :
                        task.status === 'doing' ? 'bg-blue-500' :
                        'bg-gray-400'
                      }`} />
                      <span className="text-sm text-gray-900 truncate">{task.title}</span>
                      <span className={`text-xs px-2 py-1 rounded ${
                        task.priority === 'high' ? 'bg-red-100 text-red-700' :
                        task.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-green-100 text-green-700'
                      }`}>
                        {task.priority === 'high' ? '高' : task.priority === 'medium' ? '中' : '低'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                <p className="text-sm text-blue-800">
                  {FaCheck({ className: "inline w-3 h-3 mr-1" })}
                  移行後、ゲストデータは自動的に削除されます
                </p>
              </div>

              <div className="flex gap-3">
                <Button
                  variant="secondary"
                  onClick={handleCancel}
                  className="flex-1"
                >
                  後で移行する
                </Button>
                <Button
                  variant="primary"
                  onClick={handleConfirm}
                  className="flex-1"
                  leftIcon={FaCheck}
                >
                  引き継ぐ
                </Button>
              </div>
            </div>
          </>
        )}

        {/* 移行中ステップ */}
        {step === 'migrating' && (
          <div className="p-8 text-center">
            {FaSpinner({ className: "w-8 h-8 text-blue-600 mx-auto mb-4 animate-spin" })}
            <h2 className="text-xl font-bold text-gray-900 mb-2">移行中...</h2>
            <p className="text-gray-600 text-sm">
              タスクをアカウントに移行しています。少々お待ちください。
            </p>
          </div>
        )}

        {/* 成功ステップ */}
        {step === 'success' && (
          <div className="p-8 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              {FaCheck({ className: "w-8 h-8 text-green-600" })}
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">移行完了！</h2>
            <p className="text-gray-600 text-sm">
              {guestTasks.length}個のタスクが正常にアカウントに移行されました。
            </p>
          </div>
        )}

        {/* エラーステップ */}
        {step === 'error' && (
          <>
            <div className="p-6 text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                {FaExclamationTriangle({ className: "w-8 h-8 text-red-600" })}
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">移行エラー</h2>
              <p className="text-gray-600 text-sm mb-4">
                タスクの移行中にエラーが発生しました。
              </p>
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
                  <p className="text-sm text-red-800">{error}</p>
                </div>
              )}
            </div>
            <div className="p-6 border-t border-gray-200">
              <div className="flex gap-3">
                <Button
                  variant="secondary"
                  onClick={handleCancel}
                  className="flex-1"
                >
                  キャンセル
                </Button>
                <Button
                  variant="primary"
                  onClick={handleConfirm}
                  className="flex-1"
                >
                  再試行
                </Button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}; 