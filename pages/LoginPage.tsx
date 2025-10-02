import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Alert from '../components/common/Alert';

const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const { login, handleGoogleCredentialResponse } = useAuth();
  const navigate = useNavigate();
  const isGoogleClientConfigured = Boolean(import.meta.env.VITE_GOOGLE_CLIENT_ID);


  useEffect(() => {
    if (!isGoogleClientConfigured) {
      return;
    }
    
    if (typeof (window as any).google === 'undefined' || !(window as any).google.accounts) {
      return;
    }

    const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

    try {
        (window as any).google.accounts.id.initialize({
          client_id: googleClientId,
          callback: (response: any) => {
            handleGoogleCredentialResponse(response);
            // On successful sign-in/sign-up, navigate to the dashboard
            navigate('/dashboard');
          },
        });

        const googleButtonContainer = document.getElementById('googleSignInButton');
        if (googleButtonContainer) {
            (window as any).google.accounts.id.renderButton(
              googleButtonContainer,
              { theme: "outline", size: "large", type: "standard", text: "signin_with", width: "350" }
            );
        }
    } catch (error) {
        console.error("Error initializing Google Sign-In:", error);
    }
  }, [isGoogleClientConfigured, handleGoogleCredentialResponse, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const result = await login(email, password);
    if (result.success) {
      navigate('/dashboard');
    } else {
      setError(result.message || 'Failed to sign in.');
    }
  };

  return (
    <div className="flex items-center justify-center py-12">
      <div className="w-full max-w-md space-y-8 bg-surface p-10 rounded-xl shadow-lg">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-on-surface">
            Sign in to your account
          </h2>
          <p className="mt-2 text-center text-sm text-on-surface-variant">
            Or{' '}
            <Link to="/signup" className="font-medium text-primary hover:text-primary/80">
              create a new account
            </Link>
          </p>
        </div>
        
        {isGoogleClientConfigured ? (
          <div id="googleSignInButton" className="flex justify-center"></div>
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

        {error && <Alert type="error" title="Login Failed" message={error} />}

        <form className="space-y-6" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="email-address-login" className="sr-only">Email address</label>
            <input id="email-address-login" name="email" type="email" autoComplete="email" required className="appearance-none relative block w-full px-3 py-2 border border-gray-600 bg-gray-700 placeholder-gray-400 text-on-surface rounded-md focus:outline-none focus:ring-primary focus:border-primary sm:text-sm" placeholder="Email address" value={email} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)} />
          </div>

          <div>
            <label htmlFor="password-login" className="sr-only">Password</label>
            <input id="password-login" name="password" type="password" autoComplete="current-password" required className="appearance-none relative block w-full px-3 py-2 border border-gray-600 bg-gray-700 placeholder-gray-400 text-on-surface rounded-md focus:outline-none focus:ring-primary focus:border-primary sm:text-sm" placeholder="Password" value={password} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)} />
          </div>

          <div className="pt-2">
            <button type="submit" className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary">
              Sign in
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LoginPage;