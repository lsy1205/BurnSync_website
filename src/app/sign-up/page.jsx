'use client'
import { useState, useEffect } from 'react';
import { useCreateUserWithEmailAndPassword } from 'react-firebase-hooks/auth'
import { auth } from '@/app/firebase/config'
import { useRouter } from 'next/navigation';
import { addUser } from '../firebase/firestore';
import ErrorModal from '../components/ErrorModal';
import { FaEye, FaEyeSlash } from 'react-icons/fa';


const SignUp = () => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [errors, setErrors] = useState({});

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const router = useRouter();

  const [createUserWithEmailAndPassword] = useCreateUserWithEmailAndPassword(auth);
  

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    const user = sessionStorage.getItem('user');
    if (user) {
      router.push('/');
    }
  }, [router]);

  const handleError = (error) => {
    setErrorMessage(error);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  const validateForm = () => {
    const newErrors = {};
    
    // Validate username
    if (!username.trim()) {
      newErrors.username = 'Username is required';
    }

    // Validate Email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
    if (!email || !emailRegex.test(email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    // Validate password
    if (!password || password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    // Validate confirm password
    if (password !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSignUp = async () => {
    if (!validateForm()) return;

    try {
      const res = await createUserWithEmailAndPassword(email, password);
      if (res) {
        const uid = res.user.uid;
        console.log(`User created with UID: ${uid}`);

        sessionStorage.setItem('user', true);
        sessionStorage.setItem('username', username);
        sessionStorage.setItem('uid', uid )

        try{
          addUser(uid, username);
        } catch(e){
          console.log("Fail to store user");
          console.log(e);
        }
        setUsername('');
        setEmail('');
        setPassword('');
        setConfirmPassword('');
        router.push('/');
      }
      else{
        throw("Fail to register")
      }
    } catch(e) {
      console.log(e)
      handleError(e);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-emerald-50">
      <div className="w-full max-w-md px-6 py-8 sm:px-8">
        <div className="bg-white p-8 rounded-2xl shadow-lg">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Create Account</h1>
            <p className="text-gray-600">Join BurnSync today</p>
          </div>

          <div className="space-y-4">
            <div>
              <input 
                type="text" 
                placeholder="Username" 
                value={username} 
                onChange={(e) => setUsername(e.target.value)} 
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-green-500 focus:ring-2 focus:ring-green-200 transition-all outline-none text-gray-800 placeholder-gray-400"
              />
              {errors.username && <p className="text-red-500 text-sm mt-1">{errors.username}</p>}
            </div>

            <div>
              <input 
                type="email" 
                placeholder="Email" 
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-green-500 focus:ring-2 focus:ring-green-200 transition-all outline-none text-gray-800 placeholder-gray-400"
              />
              {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
            </div>

            <div className="relative">
              <input 
                type={showPassword ? 'text' : 'password'}
                placeholder="Password" 
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-green-500 focus:ring-2 focus:ring-green-200 transition-all outline-none text-gray-800 placeholder-gray-400"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500"
              >
                {!showPassword ? <FaEyeSlash /> : <FaEye />}
              </button>
              {errors.password && <p className="text-red-500 text-sm mt-1">{errors.password}</p>}
            </div>

            <div className="relative">
              <input 
                type={showConfirmPassword ? 'text' : 'password'}
                placeholder="Confirm Password" 
                value={confirmPassword} 
                onChange={(e) => setConfirmPassword(e.target.value)} 
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-green-500 focus:ring-2 focus:ring-green-200 transition-all outline-none text-gray-800 placeholder-gray-400"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500"
              >
                {!showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
              </button>
              {errors.confirmPassword && <p className="text-red-500 text-sm mt-1">{errors.confirmPassword}</p>}
            </div>

            {errors.submit && (
              <div className="bg-red-50 text-red-500 p-3 rounded-lg text-sm">
                {errors.submit}
              </div>
            )}

            <button 
              onClick={handleSignUp}
              className="w-full py-3 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white rounded-lg font-medium transition-all duration-200 transform hover:scale-[1.02]"
            >
              Sign Up
            </button>

            <div className="text-center mt-6">
              <p className="text-gray-600">Already have an account?</p>
              <button 
                onClick={() => router.push('/sign-in')}
                className="mt-2 w-full py-3 border-2 border-green-500 text-green-600 rounded-lg font-medium hover:bg-green-50 transition-all duration-200"
              >
                Sign In
              </button>
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
};

export default SignUp;