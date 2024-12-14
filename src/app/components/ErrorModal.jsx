import { useEffect } from 'react';

const ErrorModal = ({ isOpen, onClose, errorMessage }) => {
  useEffect(() => {
    // 當模態視窗開啟時，阻止背景滾動
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
    // 清理函數，在元件卸載或 isOpen 改變時執行
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-lg p-6 max-w-sm w-full">
        <h2 className="text-xl font-semibold text-red-600 mb-4">Error!</h2>
        <h3 className="text-gray-700">{errorMessage}</h3>
        <button
          onClick={onClose}
          className="mt-6 w-full bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 focus:outline-none"
        >
          Close
        </button>
      </div>
    </div>
  );
};

export default ErrorModal;
