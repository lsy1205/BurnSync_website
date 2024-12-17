'use client'
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

import { auth } from '@/app/firebase/config';
import { signOut } from 'firebase/auth';
import { getUser, addExcercise, editExercise, uploadExercise } from './firebase/firestore';

import ErrorModal from './components/ErrorModal';

import Chart from 'chart.js/auto';

export default function Home() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [targetCalories, setTargetCalories] = useState(0);
  const [suggestion, setSuggestion] = useState('');

  const [isLoading, setIsLoading] = useState(false);

  const [AILoading, setAILoading] = useState(false);
  
  const [isMerging, setIsMerging] = useState(false);
  
  const [errors, setErrors] = useState({});
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // user information
  const [userInfo, setUserInfo] = useState({
    height: null,
    weight: null,
    birthday: null,
    gender: null
  });

  const [age, setAge] = useState(0);

  const [exercises, setExercises] = useState({
    pushups: { sets: 0, reps: 0 },
    situps: { sets: 0, reps: 0 },
    squats: { sets: 0, reps: 0 },
    dumbbells: { sets: 0, reps: 0 }
  });

  const [isEditing, setIsEditing] = useState(false);
  
  const [editableExercises, setEditableExercises] = useState({
    pushups: { sets: exercises.pushups.sets, reps: exercises.pushups.reps },
    situps: { sets: exercises.situps.sets, reps: exercises.situps.reps },
    squats: { sets: exercises.squats.sets, reps: exercises.squats.reps },
    dumbbells: { sets: exercises.dumbbells.sets, reps: exercises.dumbbells.reps }
  });
  
  const [calories, setCalories] = useState(0);

  const [bleDevice, setBleDevice] = useState(null);
  const [bleCharacteristic, setBleCharacteristic] = useState(null);
  const [charts, setCharts] = useState({ accel: null, gyro: null });

  let prevRecord = false;
  let record = false;
  let imuData = {"AccelX":[], "AccelY":[], "AccelZ":[], "GyroX":[], "GyroY":[], "GyroZ":[]}

  useEffect(() => {
    const user = sessionStorage.getItem('user');
    const uid = sessionStorage.getItem('uid');
    const storedUsername = sessionStorage.getItem('username');
    if (!user) {
      router.push('/sign-in');
    } else {
      setUsername(storedUsername);
      const getData = async(uid) => {
        try{
          setIsLoading(true);
          const data = await getUser(uid);
          // console.log(data);
          const userExercise = data.exercises;
          setExercises(userExercise);

          const info = data.info;
          setUserInfo(info);
          setAge(calculateAge(info.birthday));
          setIsLoading(false);
        }catch(e){
          console.log(e);
        }
      }
      getData(uid);
    }
  }, [router]);


  // update calories
  useEffect(() => {
    let genderCoefficient = (userInfo.gender == "Male") ? 1.0 : 0.9;
    let weightCoefficient = userInfo.weight / 70;
    let ageCoefficient =  Math.max((1 - (age - 25) * 0.005), 0.75);
    const C = genderCoefficient * weightCoefficient * ageCoefficient * (exercises.pushups.reps * 0.5 + exercises.situps.reps * 0.3 + exercises.squats.reps * 0.32 + exercises.dumbbells.reps * 0.4);
    setCalories(C.toFixed(2));
  }, [exercises]);

  // update chart
  useEffect(() => {
    let accelChart = null;
    let gyroChart = null;

    const initCharts = () => {
      const accelCtx = document.getElementById('accelChart')?.getContext('2d');
      const gyroCtx = document.getElementById('gyroChart')?.getContext('2d');

      if (accelCtx && gyroCtx) {
        accelChart = new Chart(accelCtx, {
          type: 'line',
          data: {
            labels: Array(50).fill(''),
            datasets: [
              { label: 'X', borderColor: 'red', data: [], tension: 0.4 },
              { label: 'Y', borderColor: 'green', data: [], tension: 0.4 },
              { label: 'Z', borderColor: 'blue', data: [], tension: 0.4 }
            ]
          },
          options: {
            animation: false,
            responsive: true,
            maintainAspectRatio: false,
            scales: { 
              y: { beginAtZero: true },
              x: { display: false }
            }
          }
        });

        gyroChart = new Chart(gyroCtx, {
          type: 'line',
          data: {
            labels: Array(50).fill(''),
            datasets: [
              { label: 'X', borderColor: 'orange', data: [], tension: 0.4 },
              { label: 'Y', borderColor: 'purple', data: [], tension: 0.4 },
              { label: 'Z', borderColor: 'brown', data: [], tension: 0.4 }
            ]
          },
          options: {
            animation: false,
            responsive: true,
            maintainAspectRatio: false,
            scales: { 
              y: { beginAtZero: true },
              x: { display: false }
            }
          }
        });

        setCharts({ accel: accelChart, gyro: gyroChart });
      }
    };

    if (typeof window !== 'undefined') {
      initCharts();
    }

    return () => {
      if (accelChart) {
        accelChart.destroy();
      }
      if (gyroChart) {
        gyroChart.destroy();
      }
    };
  }, []);

  // BLE connection
  useEffect(() => {
    return () => {
      // 組件卸載時斷開 BLE 連接
      const disconnectBLE = async () => {
        if (isConnected) {
          try {
            if (bleCharacteristic) {
              await bleCharacteristic.stopNotifications();
            }
            if (bleDevice) {
              await bleDevice.gatt.disconnect();
            }
            setBleDevice(null);
            setBleCharacteristic(null);
            setIsConnected(false);
            console.log('Device disconnected on unmount');
          } catch (error) {
            console.error('Error disconnecting on unmount:', error);
          }
        }
      };
      
      disconnectBLE();
    };
  }, [bleDevice, bleCharacteristic, isConnected]);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      sessionStorage.removeItem('user');
      sessionStorage.removeItem('username');
      sessionStorage.removeItem('uid');
      router.push('/sign-in');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  // BLE connection function
  const handleBleConnection = async () => {
    if (isConnected) {
      try {
        if (bleCharacteristic) {
          await bleCharacteristic.stopNotifications();
        }
        if (bleDevice) {
          await bleDevice.gatt.disconnect();
        }
        setBleDevice(null);
        setBleCharacteristic(null);
        setIsConnected(false);
        console.log('Device disconnected successfully');
      } catch (error) {
        console.error('Disconnect error:', error);
      }
    } else {
      try {
        const device = await navigator.bluetooth.requestDevice({
          acceptAllDevices: true,
          optionalServices: ['12345678-1234-1234-1234-123456789abc'] // 使用你的服務 UUID
        });

        console.log('Selected device:', device);
        setBleDevice(device);

        const server = await device.gatt.connect();
        console.log('Connected to GATT server');

        const service = await server.getPrimaryService('12345678-1234-1234-1234-123456789abc');
        console.log('Got primary service');

        const characteristic = await service.getCharacteristic('87654321-4321-4321-4321-abcde1234567');
        console.log('Got characteristic');
        setBleCharacteristic(characteristic);

        characteristic.addEventListener('characteristicvaluechanged', (event) => {
          const data = event.target.value;
          // console.log('Received data:', data);
          const accelX = data.getFloat32(0, true);
          const accelY = data.getFloat32(4, true);
          const accelZ = data.getFloat32(8, true);
          const gyroX = data.getFloat32(12, true);
          const gyroY = data.getFloat32(16, true);
          const gyroZ = data.getFloat32(20, true);
          
          const recordByte = data.getUint8(24);
          record = recordByte === 1; // true or false
          
          // console.log('Record:', record, prevRecord);
          // deal with recording data 
          if (record) {
            console.log("Recording");
            imuData["AccelX"].push(accelX);
            imuData["AccelY"].push(accelY);
            imuData["AccelZ"].push(accelZ);
            imuData["GyroX"].push(gyroX);
            imuData["GyroY"].push(gyroY);
            imuData["GyroZ"].push(gyroZ);
          }

          // deal with inference 
          if (!record && prevRecord) {
            handleInference();
            imuData["AccelX"]=[];
            imuData["AccelY"]=[];
            imuData["AccelZ"]=[];
            imuData["GyroX"]=[];
            imuData["GyroY"]=[];
            imuData["GyroZ"]=[];
            console.log(imuData);
          }
          updateCharts(
            [accelX, accelY, accelZ],
            [gyroX, gyroY, gyroZ]
          );

          prevRecord = record;
        });

        await characteristic.startNotifications();
        console.log('Started notifications');
        setIsConnected(true);

        // 監聽設備斷開連接事件
        device.addEventListener('gattserverdisconnected', () => {
          console.log('Device disconnected');
          setIsConnected(false);
          setBleDevice(null);
          setBleCharacteristic(null);
        });

      } catch (error) {
        console.error('BLE connection error:', error);
        setIsConnected(false);
      }
    }
  };
  // Chart update function
  const updateCharts = (accelData, gyroData) => {
    if (charts.accel && charts.gyro) {
      // 更新加速度圖表
      charts.accel.data.datasets.forEach((dataset, index) => {
        dataset.data.push(accelData[index]);
        if (dataset.data.length > 50) {
          dataset.data.shift();
        }
      });
      charts.accel.update('none');

      // 更新陀螺儀圖表
      charts.gyro.data.datasets.forEach((dataset, index) => {
        dataset.data.push(gyroData[index]);
        if (dataset.data.length > 50) {
          dataset.data.shift();
        }
      });
      charts.gyro.update('none');
    }
  };

  // Geminin AI suggestion
  const handleSuggestion = async () => {
    try {
      const missingInfo = Object.values(userInfo).some((info) => info === null);
      if (missingInfo) {throw new Error('Missing user information.\nPlease complete your profile first.')};

      if (!(targetCalories > 0)|| !(targetCalories)) { throw new Error('Please enter a valid target calories value.') };

      setAILoading(true);
      setSuggestion('Loading...');
      
      // Prompt for the AI model
      const prompt = 
      `Based on the following details:
- approximate calories burned: ${targetCalories}
- age: ${age}
- gender: ${userInfo.gender}
- height: ${userInfo.height} cm
- weight: ${userInfo.weight} kg
please answer in the format below to  effectively achieve the approximate calories burned

Push-ups:  ___ sets, ___ repetitions
Sit-ups: ___ sets, ___ repetitions
Squats: ___ sets, ___ repetitions
Dumbbell: ___ sets, ___ repetitions`;

      // console.log(prompt);
      // use the fetch method to send an http request to /api/generate endpoint
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: {
          'Content-Type':'application/json',
        },
        body: JSON.stringify({body: prompt})
      });

      // Waits for the response to be converted to JSON format and stores it in the data variable
      const data = await response.json();
      
      //  If successful, updates the output state with the output field from the response data
      if(response.ok) {
        const res = data.output;
        const reply = formatResponse(res);
        setSuggestion(reply);
        setAILoading(false);
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      console.error('Failed to get suggestion:', error);
      handleError(error.message);
    }
  };

  const handleEdit = () => {
    setEditableExercises(exercises);
    setIsEditing(true);
  }

  const handleSave = async () => {
    if (editableExercises.pushups.sets < 0 || editableExercises.pushups.reps < 0 || editableExercises.situps.sets < 0 || editableExercises.situps.reps < 0 || editableExercises.squats.sets < 0 || editableExercises.squats.reps < 0 || editableExercises.dumbbells.sets < 0 || editableExercises.dumbbells.reps < 0) {
      handleError('Please enter valid values for sets and reps.');
      return;
    }
    setIsEditing(false);
    setExercises(editableExercises);
    console.log(editableExercises);
    try {
      console.log("Save");
      const updateDBRes = await editExercise({req: {uid: sessionStorage.getItem('uid'), exercises: editableExercises}});
      if (updateDBRes.success) {
        console.log("Successfully updated");
      }else{
        console.log("Failed to update database");
        throw new Error(updateDBRes.error);
      }
      console.log(updateDBRes);
    } catch (error) {
      console.error('Failed to save exercises:', error);
      handleError(error.message);
    }
  }

  const handleCancel = () => {
    setIsEditing(false);
    setEditableExercises(exercises);
  }

  const handleMerge = async () => {
    console.log("Merge");
    setIsMerging(true);
    try{
      let res = await uploadExercise({req: {uid: sessionStorage.getItem('uid'), calories: calories}});
      if(res.success){
        console.log("Successfully uploaded");
        setExercises({
          pushups: { sets: 0, reps: 0 },
          situps: { sets: 0, reps: 0 },
          squats: { sets: 0, reps: 0 },
          dumbbells: { sets: 0, reps: 0 }
        });
        setEditableExercises(exercises);
      }else{
        console.log("Failed to upload");
        throw new Error(res.error);
      }
    } catch (error) {
      console.error('Failed to merge data:', error);
      handleError(error.message);
    }
    setIsMerging(false);
  }

  // handle inference
  const handleInference = async () => {
    try {
      console.log("Inference");
      // Inference API
      console.log(imuData);
      const response = await fetch('/api/inference',{
        method: 'POST',
        headers: {
          'Content-Type':'application/json',
        },
        body: JSON.stringify(imuData)
      })
      const inferenceResponse = await response.json();
      console.log(inferenceResponse);
      if (inferenceResponse.success) {
        console.log("Successfully got inference");
        
        let result = inferenceResponse.result[0];
        console.log(result);
        if (result.type) {
          // Update database
          const type = result.type;
          const reps = result.reps;
          const updateDBRes = await addExcercise({req: {uid: sessionStorage.getItem('uid'), type: type, reps: reps}});
          if (updateDBRes.success) {
            console.log("Successfully updated:");
            setExercises((prev) => ({
              ...prev,
              [type]: {
                sets: prev[type].sets + 1,
                reps: prev[type].reps + reps
              }
            }));
            setEditableExercises(exercises);
            console.log(updateDBRes);
          } else{
            console.log("Failed to update database");
            throw new Error(updateDBRes.error);
          }
        } else {
          console.log("No exercise detected");
        }
        
      } else {
        console.log("Inference Failed");
        throw new Error(inferenceResponse.error);
      }
      
    } catch (error) {
      console.error('handle inference failed: ', error);
      handleError(error.message);
    }
  }

  // Calculate age
  function calculateAge(birthDateString) {
    const today = new Date();
    const birthDate = new Date(birthDateString);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDifference = today.getMonth() - birthDate.getMonth();
    if (
      monthDifference < 0 ||
      (monthDifference === 0 && today.getDate() < birthDate.getDate())
    ) {
      age--;
    }
    return age;
  }

  // Error handling
  const handleError = (error) => {
    setErrorMessage(error);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  const formatResponse = (response) => {
    let formattedText = response;

    // Replace bold: **text** => <strong>text</strong>
    formattedText = formattedText.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

    // Replace italics: *text* => <em>text</em>
    // (Do this now to prevent interfering with bullet points if bullets are processed differently)
    formattedText = formattedText.replace(/\*(.*?)\*/g, '<em>$1</em>');

    // Replace bullet lines: lines starting with "* " => <li>...</li>
    formattedText = formattedText.replace(/^\* (.*?)(?:\r?\n|$)/gm, '<li>$1</li>');
    
    // Replace newlines with paragraphs: \n => </p><p>
    // Before this step, make sure the text is in a state where this won't break HTML structure.
    formattedText = '<p>' + formattedText.replace(/\n/g, '</p><p>') + '</p>';

    return formattedText;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50">
      {/* Navigation Bar */}
      <nav className="bg-white shadow-md">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center">
              <h1 className="text-xl md:text-2xl font-bold text-gray-800">BurnSync</h1>
            </div>

            {/* Desktop Menu */}
            <div className="hidden md:flex items-center space-x-4">
              <span className="text-gray-600">Welcome, {username}</span>
              <button
                onClick={() => router.push('/profile')}
                className="px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-lg font-medium hover:from-green-600 hover:to-emerald-600 transition-all duration-200"
              >
                Profile
              </button>
              <button
                onClick={handleLogout}
                className="px-4 py-2 border-2 border-green-500 text-green-600 rounded-lg font-medium hover:bg-green-50 transition-all duration-200"
              >
                Logout
              </button>
            </div>

            {/* Mobile Menu Button */}
            <div className="md:hidden">
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="text-gray-600 hover:text-gray-800 focus:outline-none"
              >
                <svg className="h-6 w-6" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                  <path d={isMenuOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"}></path>
                </svg>
              </button>
            </div>
          </div>

          {/* Mobile Menu */}
          {isMenuOpen && (
            <div className="md:hidden pb-4">
              <div className="flex flex-col space-y-3">
                <span className="text-gray-600 py-2">Welcome, {username}</span>
                <button
                  onClick={() => {
                    router.push('/profile');
                    setIsMenuOpen(false);
                  }}
                  className="px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-lg font-medium"
                >
                  Profile
                </button>
                <button
                  onClick={() => {
                    handleLogout();
                    setIsMenuOpen(false);
                  }}
                  className="px-4 py-2 border-2 border-green-500 text-green-600 rounded-lg font-medium"
                >
                  Logout
                </button>
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        {/* BLE Connection Section */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <button
            onClick={handleBleConnection}
            className={`w-full py-4 rounded-xl font-medium transition-all duration-200 ${
              isConnected 
                ? 'bg-red-500 hover:bg-red-600 text-white'
                : 'bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white'
            }`}
          >
            {isConnected ? 'Disconnect Device' : 'Connect BLE Device'}
          </button>
          <div id="data" className="mt-4 p-4 text-center rounded-lg text-gray-700">{isConnected ? "Receiving data..." : "No device connected"}</div>
        </div>

        {/* Calories Input Section */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <div className="space-y-4">
            <h3 className="text-xl font-semibold text-gray-800"> Target Calories</h3>
            <div className="flex flex-col md:flex-row gap-4">
              <input
                type="number"
                placeholder="Target Calories"
                value={targetCalories}
                onChange={(e) => setTargetCalories(e.target.value)}
                className="flex-1 px-4 py-3 rounded-lg border border-gray-300 focus:border-green-500 focus:ring-2 focus:ring-green-200 transition-all outline-none text-gray-800 placeholder-gray-400"
              />
              <button
                onClick={handleSuggestion}
                disabled={AILoading} // Button is disabled while loading
                className={`px-6 py-3 rounded-lg font-medium transition-all duration-200 ${
                  AILoading
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-gradient-to-r from-green-500 to-emerald-500 text-white hover:from-green-600 hover:to-emerald-600'
                }`}
              >
                {AILoading ? (
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Loading...</span>
                  </div>
                ) : suggestion ? (
                  'Regenerate Suggestion'
                ) : (
                  'Get Suggestion'
                )}
              </button>
            </div>
            {AILoading ? (
              <div className="flex items-center space-x-2 p-4 bg-green-50 rounded-lg">
                <div className="w-5 h-5 border-2 border-green-500 border-t-transparent rounded-full animate-spin"></div>
                <p className="text-gray-700">Loading your suggestion...</p>
              </div>
            ) : (
              (
                <div className="p-4 bg-green-50 rounded-lg">
                  <div className="text-gray-700">{suggestion ? 
                    <div className="mt-4 text-gray-700"
                    dangerouslySetInnerHTML={{ __html: suggestion }}
                  /> : "AI suggestion will display here."}</div>
                </div>
              )
            )}
          </div>
        </div>


        {/* Exercise Tracking Section */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-semibold text-gray-800">Exercise Tracking</h3>
            {!isEditing ? (
              <button
                onClick={handleEdit}
                className="px-4 py-2 text-green-600 hover:text-green-700 font-medium"
              >
                Edit
              </button>
            ) : (
              <div className="flex gap-2">
                <button
                  onClick={handleSave}
                  className="px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-lg font-medium hover:from-green-600 hover:to-emerald-600"
                >
                  Save
                </button>
                <button
                  onClick={handleCancel}
                  className="px-4 py-2 border-2 border-green-500 text-green-600 rounded-lg font-medium hover:bg-green-50"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>
          {isLoading ? (
            <div className="flex items-center justify-center">
              <div className="flex flex-col items-center">
                <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-green-500" />
                <h1 className="text-gray-600 mt-2 text-3xl">Loading...</h1>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {Object.entries({
                pushups: 'Push-ups',
                situps: 'Sit-ups',
                squats: 'Squats',
                dumbbells: 'Dumbbells',
              }).map(([key, label]) => (
                <div key={key} className="bg-green-50 p-4 rounded-xl">
                  <h3 className="font-bold text-gray-800 mb-3">{label}</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-700">Sets:</span>
                      {isEditing ? (
                        <input
                          type="number"
                          value={editableExercises[key]?.sets || 0}
                          onChange={(e) =>
                            setEditableExercises((prev) => ({
                              ...prev,
                              [key]: {
                                ...prev[key],
                                sets: Number(e.target.value),
                              },
                            }))
                          }
                          className="border border-gray-300 rounded-lg px-2 py-1 text-gray-800 w-16"
                        />
                      ) : (
                        <span className="text-xl font-semibold text-gray-800">
                          {exercises[key].sets}
                        </span>
                      )}
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-700">Reps:</span>
                      {isEditing ? (
                        <input
                          type="number"
                          value={editableExercises[key]?.reps || 0}
                          onChange={(e) =>
                            setEditableExercises((prev) => ({
                              ...prev,
                              [key]: {
                                ...prev[key],
                                reps: Number(e.target.value),
                              },
                            }))
                          }
                          className="border border-gray-300 rounded-lg px-2 py-1 text-gray-800 w-16"
                        />
                      ) : (
                        <span className="text-xl font-semibold text-gray-800">
                          {exercises[key].reps}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
          <div className="flex justify-center mt-4">
            <h3 className="mt-4 text-xl font-semibold text-gray-800">Calories Burned: {calories}</h3>
          </div>
          <div className="flex justify-center mt-4">
            <button
              disabled={isEditing || isMerging}
              onClick={handleMerge}
              className=
              {`px-6 py-3 rounded-lg font-medium transition-all duration-500 ${
                (isEditing || isMerging)
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-gradient-to-r from-green-500 to-emerald-500 text-white hover:from-green-600 hover:to-emerald-600'
              }`}
            >
              {isMerging ? "Merging Data" : "Merge Data"}
            </button>
          </div>
        </div>

        {/* Sensor Data Section - 調整顯示的文字顏色 */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h3 className="text-xl font-semibold text-gray-800 mb-4">Sensor Data</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Accelerometer Data */}
            <div className="bg-green-50 p-4 rounded-xl">
              <h4 className="font-medium text-gray-800 mb-3">Accelerometer</h4>
              <div className="space-y-2">
                <canvas id="accelChart"></canvas>
              </div>
            </div>

            {/* Gyroscope Data */}
            <div className="bg-green-50 p-4 rounded-xl">
              <h4 className="font-medium text-gray-800 mb-3">Gyroscope</h4>
              <div className="space-y-2">
                <canvas id="gyroChart"></canvas>
              </div>
            </div>
          </div>
        </div>
      </div>
      <ErrorModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        errorMessage={errorMessage}
      />
    </div>
  );
}