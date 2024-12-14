'use client'
import { useState } from 'react';
import ErrorModal from '../components/ErrorModal';

const ExamplePage = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleError = (error) => {
    setErrorMessage(error.message);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  // 模擬錯誤發生
  const simulateError = () => {
    try {
      // 這裡放置可能拋出錯誤的程式碼
      throw new Error('這是一個模擬錯誤訊息。');
    } catch (error) {
      handleError(error);
    }
  };

  return (
    <div>
      <button
        onClick={simulateError}
        className="bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 focus:outline-none"
      >
        模擬錯誤
      </button>
      <ErrorModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        errorMessage={errorMessage}
      />
    </div>
  );
};

export default ExamplePage;
