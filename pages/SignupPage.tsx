import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Alert from '../components/common/Alert';

const SignupPage: React.FC = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const { signup, handleGoogleCredentialResponse } = useAuth();
  const navigate = useNavigate();
  const isGoogleClientConfigured = !!import.meta.env.VITE_GOOGLE_CLIENT_ID;

  useEffect(() => {
    if (!isGoogleClientConfigured) {
        return;
    }

    const loadGoogleScript = () => {
      const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
      
      if ((window as any).google?.accounts?.id) {
        (window as any).google.accounts.id.initialize({
          client_id: googleClientId,
          callback: (response: any) => {
            handleGoogleCredentialResponse(response);
            navigate('/dashboard');
          },
        });
        
        const googleButtonContainer = document.getElementById('googleSignUpButton');
        if (googleButtonContainer) {
            (window as any).google.accounts.id.renderButton(
              googleButtonContainer,
              { theme: "outline", size: "large", type: "standard", text: "signup_with", width: "350" }
            );
        }
      }
    };

    // Check if script is already loaded
    if ((window as any).google?.accounts?.id) {
      loadGoogleScript();
    } else {
      // Load the script
      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.onload = loadGoogleScript;
      document.head.appendChild(script);

      return () => {
        // Cleanup
        if (document.head.contains(script)) {
          document.head.removeChild(script);
        }
      };
    }
  }, [isGoogleClientConfigured, handleGoogleCredentialResponse, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!name || !email || !password) {
      setError('Please fill in all required fields.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    
    const result = await signup(name, email, password);
    if (result.success) {
      navigate('/dashboard');
    } else {
      setError(result.message || 'Failed to create your account.');
    }
  };

  return (
    <div className="flex items-center justify-center py-12">
      <div className="w-full max-w-md space-y-8 bg-surface p-10 rounded-xl shadow-lg">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-on-surface">
            Create your account
          </h2>
          <p className="mt-2 text-center text-sm text-on-surface-variant">
            Already have an account?{' '}
            <Link to="/login" className="font-medium text-primary hover:text-primary/80">
              Sign in
            </Link>
          </p>
        </div>

        {isGoogleClientConfigured ? (
            <div id="googleSignUpButton" className="flex justify-center"></div>
        ) : (
            <div className="text-center text-sm text-yellow-400 bg-yellow-900/20 p-3 rounded-md border border-yellow-500/50">
                Google Sign-In is not configured by the administrator.
            </div>
        )}

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-600" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-surface text-on-surface-variant">Or with email</span>
          </div>
        </div>
        
        {error && <Alert type="error" title="Signup Failed" message={error} />}

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="name" className="sr-only">Full name</label>
            <input id="name" name="name" type="text" required className="appearance-none relative block w-full px-3 py-2 border border-gray-600 bg-gray-700 placeholder-gray-400 text-on-surface rounded-md focus:outline-none focus:ring-primary focus:border-primary sm:text-sm" placeholder="Full name" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div>
            <label htmlFor="email-address-signup" className="sr-only">Email address</label>
            <input id="email-address-signup" name="email" type="email" autoComplete="email" required className="appearance-none relative block w-full px-3 py-2 border border-gray-600 bg-gray-700 placeholder-gray-400 text-on-surface rounded-md focus:outline-none focus:ring-primary focus:border-primary sm:text-sm" placeholder="Email address" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div>
            <label htmlFor="phone" className="sr-only">Phone number (optional)</label>
            <input id="phone" name="phone" type="tel" className="appearance-none relative block w-full px-3 py-2 border border-gray-600 bg-gray-700 placeholder-gray-400 text-on-surface rounded-md focus:outline-none focus:ring-primary focus:border-primary sm:text-sm" placeholder="Phone number (optional)" value={phone} onChange={(e) => setPhone(e.target.value)} />
          </div>
          <div>
            <label htmlFor="password-signup" className="sr-only">Password</label>
            <input id="password-signup" name="password" type="password" required className="appearance-none relative block w-full px-3 py-2 border border-gray-600 bg-gray-700 placeholder-gray-400 text-on-surface rounded-md focus:outline-none focus:ring-primary focus:border-primary sm:text-sm" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>
          <div>
            <label htmlFor="confirm-password-signup" className="sr-only">Confirm Password</label>
            <input id="confirm-password-signup" name="confirm-password" type="password" required className="appearance-none relative block w-full px-3 py-2 border border-gray-600 bg-gray-700 placeholder-gray-400 text-on-surface rounded-md focus:outline-none focus:ring-primary focus:border-primary sm:text-sm" placeholder="Confirm Password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
          </div>
          
          <div className="pt-2">
            <button type="submit" className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary">
              Create Account
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SignupPage;