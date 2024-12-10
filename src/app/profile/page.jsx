'use client'
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

const Profile = () => {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [userInfo, setUserInfo] = useState({
    height: '175',
    weight: '70',
    age: '25',
    gender: 'Male'
  });
  const [isEditing, setIsEditing] = useState(false);
  const [editedInfo, setEditedInfo] = useState({});

  useEffect(() => {
    const user = sessionStorage.getItem('user');
    const storedUsername = sessionStorage.getItem('username');
    
    if (!user) {
      router.push('/sign-in');
    } else if (storedUsername) {
      setUsername(storedUsername);
      // 這裡可以從資料庫獲取用戶資料
      // 目前使用模擬數據
      setUserInfo({
        height: '175',
        weight: '70',
        age: '25',
        gender: 'Male'
      });
    }
  }, [router]);

  const handleEdit = () => {
    setIsEditing(true);
    setEditedInfo(userInfo);
  };

  const handleSave = () => {
    // 這裡可以加入儲存到資料庫的邏輯
    setUserInfo(editedInfo);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditedInfo(userInfo);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50">
      {/* Navigation Bar */}
      <nav className="bg-white shadow-md">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <button
              onClick={() => router.push('/')}
              className="text-xl md:text-2xl font-bold text-gray-800 hover:text-green-600 transition-colors"
            >
              BurnSync
            </button>

            {/* Desktop Back Button */}
            <div className="hidden md:block">
              <button
                onClick={() => router.push('/')}
                className="px-4 py-2 border-2 border-green-500 text-green-600 rounded-lg font-medium hover:bg-green-50 transition-all duration-200"
              >
                Back to Dashboard
              </button>
            </div>

            {/* Mobile Back Button */}
            <div className="md:hidden">
              <button
                onClick={() => router.push('/')}
                className="p-2 border-2 border-green-500 text-green-600 rounded-lg font-medium hover:bg-green-50 transition-all duration-200"
              >
                Back
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Profile Content */}
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="bg-white rounded-2xl shadow-lg p-6 md:p-8">
          {/* Profile Header */}
          <div className="text-center mb-8">
            <div className="w-24 h-24 mx-auto bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center mb-4">
              <span className="text-3xl font-bold text-white">
                {username.charAt(0).toUpperCase()}
              </span>
            </div>
            <h2 className="text-2xl font-bold text-gray-800">{username}</h2>
          </div>

          {/* Profile Information */}
          <div className="space-y-6">
            {/* Personal Information Section */}
            <div>
              <div className="flex flex-col sm:flex-row justify-between items-center mb-4">
                <h3 className="text-xl font-semibold text-gray-800 mb-2 sm:mb-0">Personal Information</h3>
                {!isEditing ? (
                  <button
                    onClick={handleEdit}
                    className="px-4 py-2 text-green-600 hover:text-green-700 font-medium"
                  >
                    Edit
                  </button>
                ) : (
                  <div className="flex flex-col sm:flex-row gap-2 sm:space-x-2 w-full sm:w-auto mt-2 sm:mt-0">
                    <button
                      onClick={handleSave}
                      className="w-full sm:w-auto px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-lg font-medium hover:from-green-600 hover:to-emerald-600"
                    >
                      Save
                    </button>
                    <button
                      onClick={handleCancel}
                      className="w-full sm:w-auto px-4 py-2 border-2 border-green-500 text-green-600 rounded-lg font-medium hover:bg-green-50"
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Object.entries({
                  height: 'Height (cm)',
                  weight: 'Weight (kg)',
                  age: 'Age',
                  gender: 'Gender'
                }).map(([key, label]) => (
                  <div key={key} className="bg-green-50 p-4 rounded-xl">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {label}
                    </label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={editedInfo[key] || ''}
                        onChange={(e) => setEditedInfo({
                          ...editedInfo,
                          [key]: e.target.value
                        })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-green-500 focus:ring-2 focus:ring-green-200 text-gray-800"
                      />
                    ) : (
                      <p className="text-gray-800 font-medium">{userInfo[key]}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Fitness Statistics */}
            <div className="mt-8">
              <h3 className="text-xl font-semibold text-gray-800 mb-4">Fitness Statistics</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-green-50 p-4 rounded-xl text-center">
                  <p className="text-gray-600 mb-1">Total Exercise Days</p>
                  <p className="text-2xl font-bold text-gray-800">15</p>
                </div>
                <div className="bg-green-50 p-4 rounded-xl text-center">
                  <p className="text-gray-600 mb-1">Total Calories Burnt</p>
                  <p className="text-2xl font-bold text-gray-800">4,800</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
