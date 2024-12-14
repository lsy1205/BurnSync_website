'use client'
import { useState, useEffect } from 'react';
import { useSignInWithEmailAndPassword } from 'react-firebase-hooks/auth'
import { auth } from '@/app/firebase/config'
import { useRouter } from 'next/navigation';
import { FaEye, FaEyeSlash } from 'react-icons/fa';
import { getUser } from '../firebase/firestore';

const SignIn = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  const [errors, setErrors] = useState({});
  
  const [showPassword, setShowPassword] = useState(false);
  
  const router = useRouter()
  
  const [signInWithEmailAndPassword, user, error,] = useSignInWithEmailAndPassword(auth);
  const [isLoading, setIsLoading] = useState(false);
  
  useEffect(() => {
    console.log("auth")
    console.log(auth);
    const user = sessionStorage.getItem('user');
    if (user) {
      router.push('/');
    }
  }, [router]);

  const validateForm = () => {
    const newErrors = {};
    // Validate Email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
    if (!email || !emailRegex.test(email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    // Validate password
    if (!password || password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSignIn = async () => {
    if (!validateForm()) return;

    try {
      const res = await signInWithEmailAndPassword(email, password);
      console.log(res);
      
      if (res) {
        try{
          setIsLoading(true);
          const userInfo = await getUser(res.user.uid);
          
          sessionStorage.setItem('user', true);
          sessionStorage.setItem('username', userInfo.name);
          sessionStorage.setItem('uid', res.user.uid );
          setEmail('');
          setPassword('');
          router.push('/');
          setIsLoading(false);
        }catch(e){
          console.log(e);
        }
      }
      else{
        throw("Fail to login");
      }
    } catch(e) {
      console.error(e);
      setErrors({ submit: 'Login failed. Please check your credentials.' });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-emerald-50">
      { isLoading ? (
        <div className="flex items-center justify-center min-h-screen">
          <div className="flex flex-col items-center">
            <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-green-500" /> 
            <h1 className="text-gray-600 mt-2 text-3xl">Loading...</h1>
          </div>
        </div>
        ) : (
        <div className="w-full max-w-md px-6 py-8 sm:px-8">
          <div className="bg-white p-8 rounded-2xl shadow-lg">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-gray-800 mb-2">Welcome Back</h1>
              <p className="text-gray-600">Sign in to your BurnSync account</p>
            </div>

            <div className="space-y-4">
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

              {errors.submit && (
                <div className="bg-red-50 text-red-500 p-3 rounded-lg text-sm">
                  {errors.submit}
                </div>
              )}

              <button 
                onClick={handleSignIn}
                className="w-full py-3 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white rounded-lg font-medium transition-all duration-200 transform hover:scale-[1.02]"
              >
                Sign In
              </button>

              <div className="text-center mt-6">
                <p className="text-gray-600">Don't have an account?</p>
                <button 
                  onClick={() => router.push('/sign-up')}
                  className="mt-2 w-full py-3 border-2 border-green-500 text-green-600 rounded-lg font-medium hover:bg-green-50 transition-all duration-200"
                >
                  Create Account
                </button>
              </div>
            </div>
          </div>
        </div>
        )
      }
    </div>
  );
};

export default SignIn;