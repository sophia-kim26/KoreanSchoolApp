import React, { useState, useRef, useEffect } from 'react';
import { Lock, CheckCircle, XCircle, RefreshCw, Copy, Check } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function TALogin() {
    const navigate = useNavigate();
    const [authState, setAuthState] = useState('home'); // home, enterPin, authenticated
    const [pin, setPin] = useState(['', '', '', '', '', '']);
    const [currentUser, setCurrentUser] = useState(null);
    const [error, setError] = useState('');
    const [showNewPin, setShowNewPin] = useState(false);
    const [newlyCreatedPin, setNewlyCreatedPin] = useState('');
    const [copied, setCopied] = useState(false);
    
    const pinRefs = useRef([]);

    // Generate random 6-digit PIN
    const generatePin = () => {
        return Math.floor(100000 + Math.random() * 900000).toString();
    };

    // Create new account with random PIN
    const handleCreateAccount = () => {
        const newPin = generatePin();
        const newUser = {
            pin: newPin,
            id: `user_${Date.now()}`,
            createdAt: new Date().toISOString(),
            data: {
                notes: [],
                preferences: {}
            }
        };
        
        // Get existing accounts
        const accounts = JSON.parse(localStorage.getItem('pin_accounts') || '{}');
        accounts[newPin] = newUser;
        localStorage.setItem('pin_accounts', JSON.stringify(accounts));
        
        setNewlyCreatedPin(newPin);
        setShowNewPin(true);
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
        setTimeout(() => pinRefs.current[0]?.focus(), 100);
    };

    // Handle PIN input
    const handlePinChange = (index, value) => {
        if (!/^\d*$/.test(value)) return;
        
        const newPin = [...pin];
        newPin[index] = value.slice(-1);
        setPin(newPin);
        
        if (value && index < 5) {
            pinRefs.current[index + 1]?.focus();
        }
    };

    const handlePinKeyDown = (index, e) => {
        if (e.key === 'Backspace' && !pin[index] && index > 0) {
            pinRefs.current[index - 1]?.focus();
        }
    };

    const handlePinPaste = (e) => {
        e.preventDefault();
        const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
        if (pastedData.length > 0) {
            const newPin = [...pin];
            for (let i = 0; i < pastedData.length && i < 6; i++) {
                newPin[i] = pastedData[i];
            }
            setPin(newPin);
            const nextIndex = Math.min(pastedData.length, 5);
            pinRefs.current[nextIndex]?.focus();
        }
    };

    // Verify PIN and redirect to dashboard
    const handleVerifyPin = () => {
        const pinString = pin.join('');
        const accounts = JSON.parse(localStorage.getItem('pin_accounts') || '{}');
        
        if (accounts[pinString]) {
            setCurrentUser(accounts[pinString]);
            // Store current user in localStorage for the dashboard to access
            localStorage.setItem('current_ta_user', JSON.stringify(accounts[pinString]));
            setAuthState('authenticated');
            setError('');
            // Redirect to TA Dashboard after a brief moment
            setTimeout(() => {
                navigate('/ta/dashboard');
            }, 500);
        } else {
            setError('Invalid PIN. Please try again.');
            setPin(['', '', '', '', '', '']);
            setTimeout(() => pinRefs.current[0]?.focus(), 100);
        }
    };

    // Logout
    const handleLogout = () => {
        setCurrentUser(null);
        setPin(['', '', '', '', '', '']);
        setAuthState('home');
        setError('');
        localStorage.removeItem('current_ta_user');
    };

    const handleBackToHome = () => {
        setPin(['', '', '', '', '', '']);
        setAuthState('home');
        setError('');
    };

    useEffect(() => {
        if (authState === 'enterPin' && pin.join('').length === 6) {
            handleVerifyPin();
        }
    }, [pin]);

    const PinInput = ({ autoFocus = false }) => (
        <div className="flex gap-2 justify-center">
            {pin.map((digit, index) => (
                <input
                    key={index}
                    ref={el => pinRefs.current[index] = el}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handlePinChange(index, e.target.value)}
                    onKeyDown={(e) => handlePinKeyDown(index, e)}
                    onPaste={handlePinPaste}
                    autoFocus={autoFocus && index === 0}
                    className="w-12 h-14 text-center text-2xl font-bold border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none transition-colors"
                />
            ))}
        </div>
    );

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
                {authState === 'home' && (
                    <div className="space-y-6">
                        <div className="text-center">
                            <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
                                <Lock className="w-8 h-8 text-blue-600" />
                            </div>
                            <h1 className="text-3xl font-bold text-gray-800">TA PIN Authentication</h1>
                            <p className="text-gray-600 mt-2">Anonymous accounts with unique PINs</p>
                        </div>

                        <div className="space-y-3">
                            <button
                                onClick={handleCreateAccount}
                                className="w-full bg-blue-600 text-white py-4 rounded-lg font-semibold hover:bg-blue-700 transition flex items-center justify-center gap-2"
                            >
                                <RefreshCw className="w-5 h-5" />
                                Create New Account
                            </button>

                            <button
                                onClick={() => {
                                    setAuthState('enterPin');
                                    setTimeout(() => pinRefs.current[0]?.focus(), 100);
                                }}
                                className="w-full bg-white border-2 border-gray-300 text-gray-700 py-4 rounded-lg font-semibold hover:bg-gray-50 transition flex items-center justify-center gap-2"
                            >
                                <Lock className="w-5 h-5" />
                                Sign In with PIN
                            </button>
                        </div>

                        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-sm text-amber-800">
                            <p className="font-semibold mb-1">How it works:</p>
                            <ul className="space-y-1 list-disc list-inside">
                                <li>Create account → Get random 6-digit PIN</li>
                                <li>Your PIN is your account (no email needed)</li>
                                <li>Save your PIN securely - no recovery option</li>
                            </ul>
                        </div>
                    </div>
                )}

                {authState === 'enterPin' && (
                    <div className="space-y-6">
                        <div className="text-center">
                            <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
                                <Lock className="w-8 h-8 text-blue-600" />
                            </div>
                            <h1 className="text-2xl font-bold text-gray-800">Enter Your PIN</h1>
                            <p className="text-gray-600 mt-2">Enter your 6-digit PIN to access your account</p>
                        </div>

                        <PinInput autoFocus={true} />

                        {error && (
                            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm flex items-center gap-2">
                                <XCircle className="w-4 h-4" />
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
                )}

                {authState === 'authenticated' && (
                    <div className="space-y-6">
                        <div className="text-center">
                            <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
                                <CheckCircle className="w-8 h-8 text-green-600" />
                            </div>
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
                            <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-2">
                                <CheckCircle className="w-8 h-8 text-green-600" />
                            </div>
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
                                            <Check className="w-4 h-4 text-green-600" />
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

                            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-sm text-amber-800 text-left">
                                <p className="font-semibold mb-1">⚠️ Important:</p>
                                <ul className="space-y-1 list-disc list-inside">
                                    <li>Save this PIN securely</li>
                                    <li>There is no way to recover it</li>
                                    <li>Anyone with this PIN can access your account</li>
                                </ul>
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