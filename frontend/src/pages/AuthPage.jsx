import React, { useState } from 'react';
import { GoogleLogin } from '@react-oauth/google';
import './AuthPage.css';

const AuthPage = () => {
  const [isLogin, setIsLogin] = useState(true);

  const handleGoogleSuccess = async (credentialResponse) => {
    try {
      const res = await fetch('http://localhost:8000/api/v1/auth/google-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: credentialResponse.credential }),
      });
      const data = await res.json();
      console.log('Login Successful:', data);
    } catch (error) {
      console.error('Error authenticating with backend', error);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2 className="auth-title">
          {isLogin ? 'Sign in to SafeNav' : 'Create an Account'}
        </h2>
        <p className="auth-subtitle">
          {isLogin ? 'Welcome back to your dashboard.' : 'Join to track your scan history.'}
        </p>

        <div className="google-btn-wrapper">
          <GoogleLogin
            onSuccess={handleGoogleSuccess}
            onError={() => {
              console.log('Google Login Failed');
            }}
            theme="filled_black"
            shape="rectangular"
            size="large"
            width="100%"
          />
        </div>

        <div className="divider">
          <span>OR CONTINUE WITH EMAIL</span>
        </div>

        <form className="auth-form" onSubmit={(e) => e.preventDefault()}>
          {!isLogin && (
            <input type="text" placeholder="Full Name" className="auth-input" />
          )}
          <input type="email" placeholder="Email Address" className="auth-input" />
          <input type="password" placeholder="Password" className="auth-input" />
          
          <button type="submit" className="auth-submit-btn">
            {isLogin ? 'Sign In' : 'Sign Up'}
          </button>
        </form>

        <p className="auth-toggle">
          {isLogin ? "Don't have an account? " : "Already have an account? "}
          <span onClick={() => setIsLogin(!isLogin)}>
            {isLogin ? 'Sign up' : 'Log in'}
          </span>
        </p>
      </div>
    </div>
  );
};

export default AuthPage;