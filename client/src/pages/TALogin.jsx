import React, { useState, useRef, useEffect } from 'react';
import { Lock, CheckCircle, XCircle, RefreshCw, Copy, Check, Container } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import './style/TALoginCSS.css';
import logo from '../assets/logo.png';

export default function TALogin() {
    const navigate = useNavigate();
    const [authState, setAuthState] = useState('home'); // home, enterPin, authenticated, createAccountForm
    const [pin, setPin] = useState('');
    const [currentUser, setCurrentUser] = useState(null);
    const [error, setError] = useState('');
    const [showNewPin, setShowNewPin] = useState(false);
    const [newlyCreatedPin, setNewlyCreatedPin] = useState('');
    const [copied, setCopied] = useState(false);
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [email, setEmail] = useState('');
    const [sessionDay, setSessionDay] = useState('');
    
    const pinInputRef = useRef(null);

    // Generate random 6-digit PIN
    const generatePin = () => {
        return Math.floor(100000 + Math.random() * 900000).toString();
    };

    const handleCreateAccount = () => {
        setAuthState('createAccountForm');
    };

    const handleCopyPin = () => {
        navigator.clipboard.writeText(newlyCreatedPin);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleCloseNewPin = () => {
        setShowNewPin(false);
        setNewlyCreatedPin('');
    };

    const handleGoToSignIn = () => {
        setShowNewPin(false);
        setAuthState('enterPin');
        setTimeout(() => pinInputRef.current?.focus(), 100);
    };

    // Handle PIN input
    const handlePinChange = (value) => {
        // Only allow digits and limit to 6 characters
        const numericValue = value.replace(/\D/g, '').slice(0, 6);
        setPin(numericValue);
    };

    // Verify PIN and redirect to dashboard
    const handleVerifyPin = async () => {
        try {
            const response = await fetch('http://localhost:3001/api/signin', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ta_code: pin
                })
            });

            const data = await response.json();

            if (data.success) {
                setCurrentUser(data.ta);
                // Store current user in localStorage for the dashboard to access
                localStorage.setItem('current_ta_user', JSON.stringify(data.ta));
                setAuthState('authenticated');
                setError('');
                // Redirect to TA Dashboard after a brief moment
                setTimeout(() => {
                    navigate('/ta/dashboard');
                }, 500);
            } else {
                setError(data.error || 'Invalid PIN. Please try again.');
                setPin('');
                setTimeout(() => pinInputRef.current?.focus(), 100);
            }
        } catch (error) {
            setError('Failed to sign in. Please try again.');
            setPin('');
            setTimeout(() => pinInputRef.current?.focus(), 100);
            console.error('Error signing in:', error);
        }
    };

    // Logout
    const handleLogout = () => {
        setCurrentUser(null);
        setPin('');
        setAuthState('home');
        setError('');
        localStorage.removeItem('current_ta_user');
    };

    const handleBackToHome = () => {
        setPin('');
        setAuthState('home');
        setError('');
    };

    useEffect(() => {
        if (authState === 'enterPin' && pin.length === 6) {
            handleVerifyPin();
        }
    }, [pin]);

    const handleSubmitNewAccount = async () => {
        if (!firstName || !lastName || !email || !sessionDay) {
            setError('Please fill in all fields');
            return;
        }

        const newPin = generatePin();

        try {
            const response = await fetch('http://localhost:3001/api/create-account', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    first_name: firstName,
                    last_name: lastName,
                    email: email,
                    ta_code: newPin,
                    session_day: sessionDay
                })
            });

            const data = await response.json();

            if (data.success) {
                setNewlyCreatedPin(newPin);
                setShowNewPin(true);
                setAuthState('home');
                setError('');
                
                // Clear form
                setFirstName('');
                setLastName('');
                setEmail('');
                setSessionDay('');
            } else {
                setError(data.error || 'Failed to create account');
            }
        } catch (error) {
            setError('Failed to create account. Please try again.');
            console.error('Error creating account:', error);
        }
    };

    const PinInput = ({ autoFocus = false }) => (
        <div className="flex justify-center">
            <input
                ref={pinInputRef}
                type="password"
                inputMode="numeric"
                maxLength={6}
                value={pin}
                onChange={(e) => handlePinChange(e.target.value)}
                autoFocus={autoFocus}
                placeholder="Enter 6-digit PIN"
                className="line-input"
            />
        </div>
    );

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
                <img 
                    src={logo} 
                    alt="Logo" 
                    className="absolute top-4 right-4 h-16 w-auto"
                />
                {authState === 'home' && (
                    <div className="space-y-6">
                        <div className="text-center">
                            <h1 className="text-3xl font-bold text-gray-800">TA PIN Authentication</h1>
                        </div>

                        <div className="space-y-3">
                            <button
                                onClick={handleCreateAccount}
                                className="w-full bg-blue-600 text-white py-4 rounded-lg font-semibold hover:bg-blue-700 transition flex items-center justify-center gap-2"
                            >
                                Create New Account
                            </button>

                            <button
                                onClick={() => {
                                    setAuthState('enterPin');
                                    setTimeout(() => pinInputRef.current?.focus(), 100);
                                }}
                                className="w-full bg-white border-2 border-gray-300 text-gray-700 py-4 rounded-lg font-semibold hover:bg-gray-50 transition flex items-center justify-center gap-2"
                            >
                                Sign In with PIN
                            </button>
                        </div>
                    </div>
                )}

                {authState === 'createAccountForm' && (
                    <div className="space-y-6">
                        <div className="text-center">
                            <h1 className="text-2xl font-bold text-gray-800">Create New Account</h1>
                            <p className="text-gray-600 mt-2">Enter your details to generate a PIN</p>
                        </div>

                        {error && (
                            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm flex items-center gap-2">
                                {error}
                            </div>
                        )}

                        <div className="space-y-4">
                            <input
                                type="text"
                                placeholder="First Name"
                                value={firstName}
                                onChange={(e) => setFirstName(e.target.value)}
                                className="w-full border-2 border-gray-300 p-3 rounded-lg"
                            />
                            <input
                                type="text"
                                placeholder="Last Name"
                                value={lastName}
                                onChange={(e) => setLastName(e.target.value)}
                                className="w-full border-2 border-gray-300 p-3 rounded-lg"
                            />
                            <input
                                type="email"
                                placeholder="Email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full border-2 border-gray-300 p-3 rounded-lg"
                            />
                            <select
                                value={sessionDay}
                                onChange={(e) => setSessionDay(e.target.value)}
                                className="w-full border-2 border-gray-300 p-3 rounded-lg text-gray-700"
                            >
                                <option value="">Select Session Day</option>
                                <option value="Friday">Friday</option>
                                <option value="Saturday">Saturday</option>
                                <option value="Both">Both</option>
                            </select>
                        </div>

                        <button
                            onClick={handleSubmitNewAccount}
                            className="w-full bg-blue-600 text-white py-4 rounded-lg font-semibold hover:bg-blue-700 transition"
                        >
                            Submit
                        </button>

                        <button
                            onClick={() => setAuthState('home')}
                            className="w-full text-gray-600 text-sm hover:text-gray-800"
                        >
                            ← Back to Home
                        </button>
                    </div>
                )}

                {authState === 'enterPin' && (
                    <div className="container">
                    <div className="white-box space-y-6">
                        <div className="text-center">
                            <h1 className="login-text text-2xl font-bold text-gray-800">TA Login</h1>
                            <p className="text-gray-600 mt-2">User ID</p>
                        </div>

                        <PinInput autoFocus={true} />

                        {error && (
                            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm flex items-center gap-2">
                                {error}
                            </div>
                        )}

                        <button
                            onClick={handleBackToHome}
                            className="w-full text-gray-600 text-sm hover:text-gray-800"
                        >
                            ← Back to home
                        </button>
                    </div>
                    </div>
                )}

                {authState === 'authenticated' && (
                    <div className="space-y-6">
                        <div className="text-center">
                            <h1 className="text-2xl font-bold text-gray-800">Redirecting...</h1>
                            <p className="text-gray-600 mt-2">Taking you to your dashboard</p>
                        </div>
                    </div>
                )}
            </div>

            {showNewPin && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full">
                        <div className="text-center space-y-4">
                            <h2 className="text-2xl font-bold text-gray-800">Account Created!</h2>
                            <p className="text-gray-600">Your unique PIN is:</p>

                            <div className="bg-gray-50 border-2 border-gray-300 rounded-lg p-6">
                                <div className="text-4xl font-bold text-blue-600 tracking-wider mb-3">
                                    {newlyCreatedPin}
                                </div>
                                <button
                                    onClick={handleCopyPin}
                                    className="flex items-center justify-center gap-2 text-sm text-gray-600 hover:text-gray-800 mx-auto"
                                >
                                    {copied ? (
                                        <>
                                            <Check className="w-4 h-4" />
                                            <span className="text-green-600">Copied!</span>
                                        </>
                                    ) : (
                                        <>
                                            <Copy className="w-4 h-4" />
                                            Copy PIN
                                        </>
                                    )}
                                </button>
                            </div>

                            <div className="space-y-2 pt-2">
                                <button
                                    onClick={handleGoToSignIn}
                                    className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition"
                                >
                                    Sign In Now
                                </button>
                                <button
                                    onClick={handleCloseNewPin}
                                    className="w-full text-gray-600 text-sm hover:text-gray-800"
                                >
                                    Close
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}