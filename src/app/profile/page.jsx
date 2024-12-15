'use client'
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getUser, editInfo } from '../firebase/firestore';
import { set } from 'firebase/database';

const Profile = () => {
  const router = useRouter();

  const [isloading, setIsLoading] = useState(false);

  const [username, setUsername] = useState('');
  const [userInfo, setUserInfo] = useState({
    height: null,
    weight: null,
    birthday: null,
    gender: null
  });
  const [editedInfo, setEditedInfo] = useState({userInfo});

  const [totalCalories, setTotalCalories] = useState(0);
  const [totalExerciseDays, setTotalExerciseDays] = useState(0);

  const [isEditing, setIsEditing] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);

  useEffect(() => {
    const user = sessionStorage.getItem('user');
    const storedUsername = sessionStorage.getItem('username');
    const uid = sessionStorage.getItem('uid');
    
    if (!user) {
      router.push('/sign-in');
    } else{
      // 這裡可以從資料庫獲取用戶資料
      setUsername(storedUsername);
      const getData = async(uid) => {
        try{
          setIsLoading(true);
          const data = await getUser(uid);
          console.log(data);
          const info = data.info;
          
          setTotalCalories(data.total_calories);
          setTotalExerciseDays(data.total_exercise_day);
          setUserInfo(info);
          setEditedInfo(info);
          setIsLoading(false);
        }catch(e){
          console.log(e);
        }
      }
      getData(uid);
    }
  }, [router]);

  const handleEdit = () => {
    setIsEditing(true);
    setEditedInfo(userInfo);
  };

  const handleSave = async () => {
    const uid = sessionStorage.getItem('uid');
    try {
      const saveInfo = {
        ...editedInfo,
        birthday: new Date(editedInfo.birthday)
      };
      let res = await editInfo(uid, saveInfo);
      console.log(res);
      if (res.success) {
        console.log('Edit Success');
        setUserInfo(editedInfo);
        setIsEditing(false);
      } else {
        throw new Error(res.error);
      }
    } catch (e) {
      console.log(e);
    }
  };
  

  const handleCancel = () => {
    setIsEditing(false);
    setEditedInfo(userInfo);
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const handleDateSelect = (year, month, day) => {
    const date = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    setEditedInfo({
      ...editedInfo,
      birthday: date
    });
    setShowDatePicker(false);
  };

  const DatePicker = ({ onSelect }) => {
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
    const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);

    const years = Array.from({ length: 100 }, (_, i) => new Date().getFullYear() - i);
    const months = Array.from({ length: 12 }, (_, i) => i + 1);
    const days = Array.from(
      { length: new Date(selectedYear, selectedMonth, 0).getDate() },
      (_, i) => i + 1
    );

    return (
      <div className="absolute top-full left-0 mt-1 w-full bg-white rounded-lg shadow-lg border border-gray-200 p-4 z-50">
        <div className="grid grid-cols-2 gap-4 mb-4">
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
            className="px-2 py-1 border rounded-lg focus:border-green-500 focus:ring-2 focus:ring-green-200 text-gray-800 bg-white"
          >
            {years.map(year => (
              <option key={year} value={year} className="text-gray-800">{year}</option>
            ))}
          </select>
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(Number(e.target.value))}
            className="px-2 py-1 border rounded-lg focus:border-green-500 focus:ring-2 focus:ring-green-200 text-gray-800 bg-white"
          >
            {months.map(month => (
              <option key={month} value={month} className="text-gray-800">
                {new Date(2000, month - 1, 1).toLocaleString('default', { month: 'long' })}
              </option>
            ))}
          </select>
        </div>
        <div className="grid grid-cols-7 gap-1">
          {days.map(day => (
            <button
              key={day}
              onClick={() => onSelect(selectedYear, selectedMonth, day)}
              className="p-2 hover:bg-green-100 rounded-lg transition-colors text-gray-800 font-medium hover:text-green-700"
            >
              {day}
            </button>
          ))}
        </div>
      </div>
    );
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
                  birthday: 'Birthday',
                  gender: 'Gender'
                }).map(([key, label]) => (
                  <div key={key} className="bg-green-50 p-4 rounded-xl">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {label}
                    </label>
                    {isEditing ? (
                      key === 'birthday' ? (
                        <div className="relative">
                          <input
                            type="text"
                            readOnly
                            value={editedInfo[key] ? formatDate(editedInfo[key]) : 'Select Birthday'}
                            onClick={() => setShowDatePicker(!showDatePicker)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg 
                              focus:border-green-500 focus:ring-2 focus:ring-green-200 
                              text-gray-800 bg-white cursor-pointer
                              hover:border-green-400 transition-colors"
                          />
                          {showDatePicker && (
                            <DatePicker onSelect={handleDateSelect} />
                          )}
                        </div>
                      ) : key === 'gender' ? (
                        <select
                          value={editedInfo[key] || ''}
                          onChange={(e) => setEditedInfo({
                            ...editedInfo,
                            [key]: e.target.value
                          })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg 
                            focus:border-green-500 focus:ring-2 focus:ring-green-200 
                            text-gray-800 bg-white
                            hover:border-green-400 transition-colors
                            cursor-pointer"
                        >
                          <option value="">Select Gender</option>
                          <option value="Male">Male</option>
                          <option value="Female">Female</option>
                          {/* <option value="Other">Other</option> */}
                        </select>
                      ) : (
                        <input
                          type="number"
                          value={editedInfo[key] || 0}
                          onChange={(e) => setEditedInfo({
                            ...editedInfo,
                            [key]: Number(e.target.value)
                          })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg 
                            focus:border-green-500 focus:ring-2 focus:ring-green-200 
                            text-gray-800"
                        />
                      )
                    ) : (
                      <p className="text-gray-800 font-medium">
                        {key === 'birthday' 
                          ? (userInfo.birthday ? formatDate(userInfo[key]) : 'Not Set')
                          : userInfo[key]
                        }
                      </p>
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
                  <p className="text-2xl font-bold text-gray-800">{totalExerciseDays}</p>
                </div>
                <div className="bg-green-50 p-4 rounded-xl text-center">
                  <p className="text-gray-600 mb-1">Total Calories Burned</p>
                  <p className="text-2xl font-bold text-gray-800">{totalCalories}</p>
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
