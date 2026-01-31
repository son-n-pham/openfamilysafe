import React, { useState } from 'react';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signInWithPopup, updateProfile } from 'firebase/auth';
import { auth, googleProvider } from '../firebase';
import { Button, Input, Card } from '../components/UI';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../services/authContext';

const Login: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);
  
  // Form State
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const navigate = useNavigate();
  const { simulateLogin } = useAuth();

  const handleGoogleLogin = async () => {
    setError('');
    setLoading(true);
    try {
      await signInWithPopup(auth, googleProvider);
      navigate('/');
    } catch (err: any) {
      console.error("Google Login Error:", err);
      if (err.code === 'auth/popup-closed-by-user') {
        setLoading(false);
        return; 
      }
      handleAuthError(err);
    } finally {
      if (auth.currentUser) setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isLogin) {
        // --- LOGIN FLOW ---
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        // --- REGISTER FLOW ---
        if (password !== confirmPassword) {
          throw new Error('Passwords do not match.');
        }
        if (password.length < 6) {
          throw new Error('Password should be at least 6 characters.');
        }
        
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        
        // Update the user's display name immediately after creation
        if (name && userCredential.user) {
          await updateProfile(userCredential.user, {
            displayName: name
          });
        }
      }
      navigate('/');
    } catch (err: any) {
      // Handle manual validation errors
      if (err.message === 'Passwords do not match.' || err.message.includes('characters')) {
        setError(err.message);
        setLoading(false);
        return;
      }
      handleAuthError(err);
    } finally {
      // If successful, component unmounts via navigate, so state update usually not needed,
      // but if error occurred we stop loading.
      if (!auth.currentUser) setLoading(false);
    }
  };

  const handleAuthError = (err: any) => {
    console.error("Auth Error:", err);
      
    const isConfigError = 
      err.code === "auth/api-key-not-valid" || 
      err.code === "auth/invalid-api-key" || 
      err.code === "auth/configuration-not-found" || 
      err.code === "auth/operation-not-allowed" ||
      err.message?.includes("api-key");

    if (isConfigError) {
      console.warn("Firebase Auth not fully configured. Switching to Demo Mode.");
      simulateLogin(email || "demo-user@example.com");
      navigate('/');
      return;
    }

    let message = 'Failed to authenticate.';
    if (err.code === 'auth/wrong-password') message = 'Incorrect password.';
    if (err.code === 'auth/user-not-found') message = 'No account found with this email.';
    if (err.code === 'auth/email-already-in-use') message = 'Email is already registered. Please sign in instead.';
    if (err.code === 'auth/weak-password') message = 'Password should be at least 6 characters.';
    
    setError(message);
    setLoading(false);
  };

  return (
    <div className="min-h-[90vh] flex flex-col justify-center py-12 sm:px-6 lg:px-8 bg-gray-50">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center mb-6">
            <div className="h-16 w-16 bg-brand-600 rounded-2xl flex items-center justify-center text-white font-bold text-3xl shadow-xl">
            O
            </div>
        </div>
        <h2 className="text-center text-3xl font-extrabold text-gray-900 tracking-tight">
          Welcome to FamilySafe
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          The secure gateway for your family's browsing.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <Card className="shadow-2xl sm:rounded-xl overflow-hidden">
          
          {/* Tabbed Interface */}
          <div className="flex border-b border-gray-200">
            <button
              onClick={() => setIsLogin(true)}
              className={`w-1/2 py-4 text-center text-sm font-medium transition-colors duration-200 ${
                isLogin 
                  ? 'text-brand-600 border-b-2 border-brand-600 bg-brand-50' 
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => setIsLogin(false)}
              className={`w-1/2 py-4 text-center text-sm font-medium transition-colors duration-200 ${
                !isLogin 
                  ? 'text-brand-600 border-b-2 border-brand-600 bg-brand-50' 
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
            >
              Create Account
            </button>
          </div>

          <div className="py-8 px-4 sm:px-10">
            <form className="space-y-5" onSubmit={handleSubmit}>
              
              {/* Extra Field for Sign Up */}
              {!isLogin && (
                <div className="animate-fade-in-down">
                  <Input
                    label="Full Name"
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Sarah Smith"
                  />
                </div>
              )}

              <Input
                label="Email address"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
              />

              <Input
                label="Password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
              />

              {/* Extra Field for Sign Up */}
              {!isLogin && (
                 <div className="animate-fade-in-down">
                  <Input
                    label="Confirm Password"
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                  />
                </div>
              )}

              {error && (
                <div className="rounded-md bg-red-50 p-3">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-red-800">{error}</h3>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <input
                    id="remember_me"
                    name="remember_me"
                    type="checkbox"
                    className="h-4 w-4 text-brand-600 focus:ring-brand-500 border-gray-300 rounded"
                  />
                  <label htmlFor="remember_me" className="ml-2 block text-sm text-gray-900">
                    Remember me
                  </label>
                </div>

                {isLogin && (
                  <div className="text-sm">
                    <a href="#" className="font-medium text-brand-600 hover:text-brand-500">
                      Forgot password?
                    </a>
                  </div>
                )}
              </div>

              <Button type="submit" className="w-full" size="lg" isLoading={loading}>
                {isLogin ? 'Sign In' : 'Sign Up'}
              </Button>
            </form>

            <div className="mt-8">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-500">Or continue with</span>
                </div>
              </div>

              <div className="mt-6">
                <button
                  onClick={handleGoogleLogin}
                  type="button"
                  className="w-full inline-flex justify-center items-center py-2.5 px-4 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-500"
                >
                  <svg className="h-5 w-5 mr-3" aria-hidden="true" viewBox="0 0 24 24">
                     <path
                       d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                       fill="#4285F4"
                     />
                     <path
                       d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                       fill="#34A853"
                     />
                     <path
                       d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                       fill="#FBBC05"
                     />
                     <path
                       d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                       fill="#EA4335"
                     />
                   </svg>
                  Sign in with Google
                </button>
              </div>
            </div>

            {/* Demo Credentials Footer */}
            <div className="mt-8 bg-gray-50 rounded-lg p-4 border border-gray-100">
               <p className="text-xs text-gray-500 text-center uppercase tracking-wide font-semibold mb-3">Demo Accounts</p>
               <div className="grid grid-cols-2 gap-4">
                 <div onClick={() => { setEmail('parent@example.com'); setPassword('pass123'); setIsLogin(true); }} className="cursor-pointer hover:bg-white p-2 rounded transition-colors text-center border border-transparent hover:border-gray-200">
                     <div className="text-xs font-bold text-gray-900">Parent</div>
                     <div className="text-[10px] text-gray-500">parent@example.com</div>
                     <div className="text-[10px] text-gray-400">pass123</div>
                 </div>
                 <div onClick={() => { setEmail('child@example.com'); setPassword('pass123'); setIsLogin(true); }} className="cursor-pointer hover:bg-white p-2 rounded transition-colors text-center border border-transparent hover:border-gray-200">
                     <div className="text-xs font-bold text-gray-900">Child</div>
                     <div className="text-[10px] text-gray-500">child@example.com</div>
                     <div className="text-[10px] text-gray-400">pass123</div>
                 </div>
               </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Login;