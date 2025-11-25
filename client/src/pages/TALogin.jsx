import React, { useState, useRef, useEffect } from 'react';
import { Lock, CheckCircle, XCircle, RefreshCw, Copy, Check } from 'lucide-react';

export default function TALogin() {
    const [authState, setAuthState] = useState('home'); // home, enterPin, authenticated
    const [pin, setPin] = useState(['', '', '', '', '', '']);
    const [currentUser, setCurrentUser] = useState(null);
    const [error, setError] = useState('');
    const [showNewPin, setShowNewPin] = useState(false);
    const [newlyCreatedPin, setNewlyCreatedPin] = useState('');
    const [copied, setCopied] = useState(false);

    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [email, setEmail] = useState('');
    const [sessionDay, setSessionDay] = useState('Friday');
    const [infoStep, setInfoStep] = useState(false);

    const pinRefs = useRef([]);

    // Generate random 6-digit PIN
    const generatePin = () => {
        return Math.floor(100000 + Math.random() * 900000).toString();
    };

    // Start account creation flow
    const handleCreateAccount = () => {
        setInfoStep(true);
    };

    // Submit TA to database AND save to localStorage
    const submitTaToDatabase = async () => {
        // Validation
        if (!firstName.trim() || !lastName.trim() || !email.trim()) {
            alert('Please fill in all fields');
            return;
        }

        const newPin = generatePin();

        const userData = {
            first_name: firstName,
            last_name: lastName,
            ta_code: newPin,
            email,
            session_day: sessionDay
        };

        try {
            // Send to backend
            const res = await fetch('http://localhost:3001/api/data', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(userData)
            });

            if (!res.ok) {
                throw new Error('Backend error');
            }

            // ALSO save to localStorage for login verification
            const accounts = JSON.parse(localStorage.getItem('pin_accounts') || '{}');
            accounts[newPin] = userData;
            localStorage.setItem('pin_accounts', JSON.stringify(accounts));

            // Show PIN modal
            setNewlyCreatedPin(newPin);
            setShowNewPin(true);
            setInfoStep(false);

            // Reset fields
            setFirstName('');
            setLastName('');
            setEmail('');
            setSessionDay('Friday');
        } catch (err) {
            console.error('Error creating account:', err);
            alert('Error creating TA account. Account will be saved locally only.');
            
            // Fallback: save to localStorage even if backend fails
            const accounts = JSON.parse(localStorage.getItem('pin_accounts') || '{}');
            accounts[newPin] = userData;
            localStorage.setItem('pin_accounts', JSON.stringify(accounts));

            setNewlyCreatedPin(newPin);
            setShowNewPin(true);
            setInfoStep(false);

            setFirstName('');
            setLastName('');
            setEmail('');
            setSessionDay('Friday');
        }
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

    // Verify PIN
    const handleVerifyPin = () => {
        const pinString = pin.join('');
        const accounts = JSON.parse(localStorage.getItem('pin_accounts') || '{}');
        
        if (accounts[pinString]) {
            setCurrentUser(accounts[pinString]);
            localStorage.setItem('current_ta_user', JSON.stringify(accounts[pinString]));
            setAuthState('authenticated');
            setError('');
            
            // Simulate redirect (since we don't have react-router in artifact)
            setTimeout(() => {
                alert('Redirecting to dashboard...\n\nIn your app, this would use:\nnavigate(\'/ta/dashboard\')');
            }, 500);
        } else {
            setError('Invalid PIN. Please try again.');
            setPin(['', '', '', '', '', '']);
            setTimeout(() => pinRefs.current[0]?.focus(), 100);
        }
    };

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
        setInfoStep(false);
    };

    useEffect(() => {
        if (authState === 'enterPin' && pin.join('').length === 6) {
            handleVerifyPin();
        }
    }, [pin, authState]);

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
                {/* HOME SCREEN */}
                {authState === 'home' && !infoStep && (
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

                {/* INFO COLLECTION STEP */}
                {authState === 'home' && infoStep && (
                    <div className="space-y-6">
                        <div className="text-center">
                            <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
                                <RefreshCw className="w-8 h-8 text-blue-600" />
                            </div>
                            <h1 className="text-2xl font-bold text-gray-800">Create Your Account</h1>
                            <p className="text-gray-600 mt-2">Fill in your information to get started</p>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                                <input
                                    type="text"
                                    value={firstName}
                                    onChange={(e) => setFirstName(e.target.value)}
                                    className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
                                    placeholder="Enter first name"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                                <input
                                    type="text"
                                    value={lastName}
                                    onChange={(e) => setLastName(e.target.value)}
                                    className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
                                    placeholder="Enter last name"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
                                    placeholder="your.email@example.com"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Session Day</label>
                                <select
                                    value={sessionDay}
                                    onChange={(e) => setSessionDay(e.target.value)}
                                    className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
                                >
                                    <option value="Saturday">Saturday</option>
                                    <option value="Both">Both</option>
                                    <option value="Friday">Friday</option>
                                </select>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <button
                                onClick={submitTaToDatabase}
                                className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition"
                            >
                                Create Account
                            </button>
                            <button
                                onClick={handleBackToHome}
                                className="w-full text-gray-600 text-sm hover:text-gray-800"
                            >
                                ← Back to home
                            </button>
                        </div>
                    </div>
                )}

                {/* ENTER PIN SCREEN */}
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

                {/* AUTHENTICATED SCREEN */}
                {authState === 'authenticated' && (
                    <div className="space-y-6">
                        <div className="text-center">
                            <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
                                <CheckCircle className="w-8 h-8 text-green-600" />
                            </div>
                            <h1 className="text-2xl font-bold text-gray-800">Welcome Back!</h1>
                            <p className="text-gray-600 mt-2">{currentUser?.first_name} {currentUser?.last_name}</p>
                        </div>

                        <div className="bg-gray-50 rounded-lg p-4 space-y-2 text-sm">
                            <div className="flex justify-between">
                                <span className="text-gray-600">Email:</span>
                                <span className="font-medium">{currentUser?.email}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-600">Session Day:</span>
                                <span className="font-medium">{currentUser?.session_day}</span>
                            </div>
                        </div>

                        <button
                            onClick={handleLogout}
                            className="w-full bg-gray-600 text-white py-3 rounded-lg font-semibold hover:bg-gray-700 transition"
                        >
                            Logout
                        </button>
                    </div>
                )}
            </div>

            {/* NEW PIN MODAL */}
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