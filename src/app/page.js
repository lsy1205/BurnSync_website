'use client'
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { auth } from '@/app/firebase/config';
import { signOut } from 'firebase/auth';


export default function Home() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [targetCalories, setTargetCalories] = useState('');
  const [suggestion, setSuggestion] = useState('');
  const [exercises, setExercises] = useState({
    pushups: { sets: 0, reps: 0 },
    situps: { sets: 0, reps: 0 },
    squats: { sets: 0, reps: 0 },
    dumbbells: { sets: 0, reps: 0 }
  });
  const [sensorData, setSensorData] = useState({
    accelerometer: { x: 0, y: 0, z: 0 },
    gyroscope: { x: 0, y: 0, z: 0 }
  });
  const [bleDevice, setBleDevice] = useState(null);
  const [bleCharacteristic, setBleCharacteristic] = useState(null);

  useEffect(() => {
    const user = sessionStorage.getItem('user');
    const storedUsername = sessionStorage.getItem('username');
    
    if (!user) {
      router.push('/sign-in');
    } else if (storedUsername) {
      setUsername(storedUsername);
    }
  }, [router]);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      sessionStorage.removeItem('user');
      sessionStorage.removeItem('username');
      router.push('/sign-in');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

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
          const accelX = data.getFloat32(0, true);
          const accelY = data.getFloat32(4, true);
          const accelZ = data.getFloat32(8, true);
          const gyroX = data.getFloat32(12, true);
          const gyroY = data.getFloat32(16, true);
          const gyroZ = data.getFloat32(20, true);

          console.log('Received sensor data:', {
            accelerometer: { x: accelX, y: accelY, z: accelZ },
            gyroscope: { x: gyroX, y: gyroY, z: gyroZ }
          });

        // updateChart(accelChart, [accelX, accelY, accelZ]);
        // updateChart(gyroChart, [gyroX, gyroY, gyroZ]);
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

  const getSuggestion = async () => {
    try {
      // Gemini API 調用邏輯將在這裡實現
      setSuggestion('AI suggestion will appear here...');
    } catch (error) {
      console.error('Failed to get suggestion:', error);
    }
  };

  const updateExercise = (type, field, value) => {
    setExercises(prev => ({
      ...prev,
      [type]: {
        ...prev[type],
        [field]: Math.max(0, parseInt(value) || 0)
      }
    }));
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
        </div>

        {/* Calories Input Section */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <div className="space-y-4">
            <div className="flex flex-col md:flex-row gap-4">
              <input
                type="number"
                placeholder="Target Calories"
                value={targetCalories}
                onChange={(e) => setTargetCalories(e.target.value)}
                className="flex-1 px-4 py-3 rounded-lg border border-gray-300 focus:border-green-500 focus:ring-2 focus:ring-green-200 transition-all outline-none text-gray-800 placeholder-gray-400"
              />
              <button
                onClick={getSuggestion}
                className="px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-lg font-medium hover:from-green-600 hover:to-emerald-600 transition-all duration-200"
              >
                {suggestion ? 'Regenerate Suggestion' : 'Get Suggestion'}
              </button>
            </div>
            {suggestion && (
              <div className="p-4 bg-green-50 rounded-lg">
                <p className="text-gray-700">{suggestion}</p>
              </div>
            )}
          </div>
        </div>

        {/* Exercise Tracking Section - 改為純顯示 */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h3 className="text-xl font-semibold text-gray-800 mb-4">Exercise Tracking</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {Object.entries({
              pushups: 'Push-ups',
              situps: 'Sit-ups',
              squats: 'Squats',
              dumbbells: 'Dumbbells'
            }).map(([key, label]) => (
              <div key={key} className="bg-green-50 p-4 rounded-xl">
                <h4 className="font-medium text-gray-800 mb-3">{label}</h4>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-700">Sets:</span>
                    <span className="text-xl font-semibold text-gray-800">
                      {exercises[key].sets}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-700">Reps:</span>
                    <span className="text-xl font-semibold text-gray-800">
                      {exercises[key].reps}
                    </span>
                  </div>
                </div>
              </div>
            ))}
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
                <div className="flex justify-between">
                  <span className="text-gray-700">X:</span>
                  <span className="font-mono text-gray-800">{sensorData.accelerometer.x.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-700">Y:</span>
                  <span className="font-mono text-gray-800">{sensorData.accelerometer.y.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-700">Z:</span>
                  <span className="font-mono text-gray-800">{sensorData.accelerometer.z.toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Gyroscope Data */}
            <div className="bg-green-50 p-4 rounded-xl">
              <h4 className="font-medium text-gray-800 mb-3">Gyroscope</h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-700">X:</span>
                  <span className="font-mono text-gray-800">{sensorData.gyroscope.x.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-700">Y:</span>
                  <span className="font-mono text-gray-800">{sensorData.gyroscope.y.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-700">Z:</span>
                  <span className="font-mono text-gray-800">{sensorData.gyroscope.z.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}