import React, { useState, useRef } from 'react';
import { Copy, Check } from 'lucide-react';
import { useNavigate, NavigateFunction } from 'react-router-dom';
import './style/global.css';
import logo from '../assets/logo.png';
import { useAuth0 } from "@auth0/auth0-react";

// Type definitions
type __AuthState__ = 'home' | 'enterCredentials' | 'authenticated' | 'createAccountForm';

interface __TAUser__ {
    id: number;
    first_name: string;
    last_name: string;
    email: string;
    ta_code: string;
    session_day: string;
    classroom?: string;
}

interface __SignInResponse__ {
    success: boolean;
    ta?: __TAUser__;
    error?: string;
}

interface __CreateAccountResponse__ {
    success: boolean;
    error?: string;
}

const CLASSROOMS = [
    '앵두꽃반',
    '제비꽃반',
    '접시꽃반',
    '초롱꽃반',
    '풀꽃반',
    '배꽃반',
    '백합반',
    '개나리반',
    '봉선화반',
    '수선화반',
    'KSL1A.도라지꽃반',
    'KSL1B.프리지아반',
    'KSL3.붓꽃반',
    'KSL4.유채꽃반',
    'KSL5 은방울꽃반',
    '진달래반',
    '채송화반',
    '월계수반',
    '모란반',
    '목련반',
    '난초반',
    '해바라기반',
    '장미반',
    '튤립반',
    '연꽃반',
    '국화반',
    '무궁화반',
];

export default function TALogin(): React.ReactElement {
    const navigate: NavigateFunction = useNavigate();
    const [authState, setAuthState] = useState<__AuthState__>('home');
    const [email, setEmail] = useState<string>('');
    const [pin, setPin] = useState<string>('');
    const [currentUser, setCurrentUser] = useState<__TAUser__ | null>(null);
    const [error, setError] = useState<string>('');
    const [showNewPin, setShowNewPin] = useState<boolean>(false);
    const [newlyCreatedPin, setNewlyCreatedPin] = useState<string>('');
    const [newlyCreatedEmail, setNewlyCreatedEmail] = useState<string>('');
    const [copied, setCopied] = useState<boolean>(false);

    // Create account form fields
    const [firstName, setFirstName] = useState<string>('');
    const [lastName, setLastName] = useState<string>('');
    const [formEmail, setFormEmail] = useState<string>('');
    const [sessionDay, setSessionDay] = useState<string>('');
    const [classroom, setClassroom] = useState<string>('');

    const emailInputRef = useRef<HTMLInputElement>(null);
    const pinInputRef = useRef<HTMLInputElement>(null);

    const { logout } = useAuth0();

    // Generate random 6-digit PIN
    const generatePin = (): string => {
        return Math.floor(100000 + Math.random() * 900000).toString();
    };

    const handleCreateAccount = (): void => {
        setAuthState('createAccountForm');
    };

    const handleCopyPin = (): void => {
        navigator.clipboard.writeText(newlyCreatedPin);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleCloseNewPin = (): void => {
        setShowNewPin(false);
        setNewlyCreatedPin('');
        setNewlyCreatedEmail('');
    };

    const handleGoToSignIn = (): void => {
        setShowNewPin(false);
        setAuthState('enterCredentials');
        setEmail(newlyCreatedEmail);
        setTimeout(() => pinInputRef.current?.focus(), 100);
    };

    const handleBack = (): void => {
        logout({
            logoutParams: {
                returnTo: window.location.origin
            }
        });
    };

    // Handle PIN input — digits only, max 6 chars
    const handlePinChange = (value: string): void => {
        const numericValue = value.replace(/\D/g, '').slice(0, 6);
        setPin(numericValue);
    };

    // Verify credentials and redirect to dashboard
    const handleVerifyCredentials = async (): Promise<void> => {
        if (!email || !pin) {
            setError('Please enter both email and PIN');
            return;
        }
        if (pin.length !== 6) {
            setError('PIN must be 6 digits');
            return;
        }

        try {
            const response = await fetch(`${process.env.REACT_APP_API_URL}/api/signin`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: email.trim(),
                    ta_code: pin
                })
            });

            const data: __SignInResponse__ = await response.json();

            if (!response.ok) {
                if (response.status === 429) {
                    setError(data.error || 'Too many login attempts. Please try again later.');
                } else {
                    setError(data.error || 'Invalid email or PIN. Please try again.');
                }
                setPin('');
                setTimeout(() => pinInputRef.current?.focus(), 100);
                return;
            }

            if (data.success && data.ta) {
                setCurrentUser(data.ta);
                localStorage.setItem('current_ta_user', JSON.stringify(data.ta));
                setAuthState('authenticated');
                setError('');
                setTimeout(() => {
                    navigate('/ta/dashboard');
                }, 500);
            } else {
                setError(data.error || 'Invalid email or PIN. Please try again.');
                setPin('');
                setTimeout(() => pinInputRef.current?.focus(), 100);
            }
        } catch (err) {
            setError('Failed to sign in. Please try again.');
            setPin('');
            setTimeout(() => pinInputRef.current?.focus(), 100);
            console.error('Error signing in:', err);
        }
    };

    const handleLogout = (): void => {
        setCurrentUser(null);
        setEmail('');
        setPin('');
        setAuthState('home');
        setError('');
        localStorage.removeItem('current_ta_user');
    };

    const handleBackToHome = (): void => {
        setEmail('');
        setPin('');
        setAuthState('home');
        setError('');
    };

    const handleSubmitNewAccount = async (): Promise<void> => {
        if (!firstName || !lastName || !formEmail || !sessionDay) {
            setError('Please fill in all required fields');
            return;
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(formEmail)) {
            setError('Please enter a valid email address');
            return;
        }

        const newPin = generatePin();

        try {
            const response = await fetch(`${process.env.REACT_APP_API_URL}/api/create-account`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    first_name: firstName,
                    last_name: lastName,
                    email: formEmail.trim(),
                    ta_code: newPin,
                    session_day: sessionDay,
                    classroom: classroom || null
                })
            });

            const data: __CreateAccountResponse__ = await response.json();

            if (!response.ok) {
                if (response.status === 429) {
                    setError(data.error || 'Too many account creation attempts. Please try again later.');
                } else {
                    setError(data.error || 'Failed to create account');
                }
                return;
            }

            if (data.success) {
                setNewlyCreatedPin(newPin);
                setNewlyCreatedEmail(formEmail.trim());
                setShowNewPin(true);
                setAuthState('home');
                setError('');
                // Clear form
                setFirstName('');
                setLastName('');
                setFormEmail('');
                setSessionDay('');
                setClassroom('');
            } else {
                setError(data.error || 'Failed to create account');
            }
        } catch (err) {
            setError('Failed to create account. Please try again.');
            console.error('Error creating account:', err);
        }
    };

    // Handle form submission with Enter key
    const handleKeyPress = (e: React.KeyboardEvent): void => {
        if (e.key === 'Enter') {
            if (authState === 'enterCredentials') {
                handleVerifyCredentials();
            }
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
                <img
                    src={logo}
                    alt="Logo"
                    className="absolute top-4 right-4 h-16 w-auto"
                />

                {/* ── HOME ── */}
                {authState === 'home' && (
                    <div className="space-y-6">
                        <div className="text-center">
                            <h1 className="text-3xl font-bold text-gray-800">TA Authentication</h1>
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
                                    setAuthState('enterCredentials');
                                    setTimeout(() => emailInputRef.current?.focus(), 100);
                                }}
                                className="w-full bg-white border-2 border-gray-300 text-gray-700 py-4 rounded-lg font-semibold hover:bg-gray-50 transition flex items-center justify-center gap-2"
                            >
                                Sign In
                            </button>
                            <div className="flex justify-center">
                                <button
                                    onClick={handleBack}
                                    className="btn-danger"
                                >
                                    ← Back
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* ── CREATE ACCOUNT FORM ── */}
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
                                placeholder="First Name *"
                                value={firstName}
                                onChange={(e) => setFirstName(e.target.value)}
                                className="w-full border-2 border-gray-300 p-3 rounded-lg"
                            />
                            <input
                                type="text"
                                placeholder="Last Name *"
                                value={lastName}
                                onChange={(e) => setLastName(e.target.value)}
                                className="w-full border-2 border-gray-300 p-3 rounded-lg"
                            />
                            <input
                                type="email"
                                placeholder="Email *"
                                value={formEmail}
                                onChange={(e) => setFormEmail(e.target.value)}
                                className="w-full border-2 border-gray-300 p-3 rounded-lg"
                            />

                            {/* Session Day — required */}
                            <select
                                value={sessionDay}
                                onChange={(e) => setSessionDay(e.target.value)}
                                className="w-full border-2 border-gray-300 p-3 rounded-lg text-gray-700"
                            >
                                <option value="">Select Session Day *</option>
                                <option value="Friday">Friday</option>
                                <option value="Saturday">Saturday</option>
                                <option value="Both">Both</option>
                            </select>

                            {/* Classroom — optional */}
                            <select
                                value={classroom}
                                onChange={(e) => setClassroom(e.target.value)}
                                className="w-full border-2 border-gray-300 p-3 rounded-lg text-gray-700"
                            >
                                <option value="">Select Classroom (Optional)</option>
                                {CLASSROOMS.map((cls) => (
                                    <option key={cls} value={cls}>
                                        {cls}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <p className="text-xs text-gray-400">* Required fields</p>

                        <button
                            onClick={handleSubmitNewAccount}
                            className="w-full bg-blue-600 text-white py-4 rounded-lg font-semibold hover:bg-blue-700 transition"
                        >
                            Submit
                        </button>
                        <button
                            onClick={() => {
                                setAuthState('home');
                                setError('');
                            }}
                            className="w-full text-gray-600 text-sm hover:text-gray-800"
                        >
                            ← Back
                        </button>
                    </div>
                )}

                {/* ── SIGN IN ── */}
                {authState === 'enterCredentials' && (
                    <div className="container">
                        <div className="white-box space-y-6">
                            <div className="text-center">
                                <h1 className="login-text text-2xl font-bold text-gray-800">TA Login</h1>
                                <p className="text-gray-600 mt-2">Enter your email and PIN</p>
                            </div>

                            {error && (
                                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm flex items-center gap-2">
                                    {error}
                                </div>
                            )}

                            <div className="space-y-4">
                                <input
                                    ref={emailInputRef}
                                    type="email"
                                    placeholder="Email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    onKeyPress={handleKeyPress}
                                    className="w-full border-2 border-gray-300 p-3 rounded-lg"
                                    autoFocus
                                />
                                <input
                                    ref={pinInputRef}
                                    type="password"
                                    inputMode="numeric"
                                    maxLength={6}
                                    value={pin}
                                    onChange={(e) => handlePinChange(e.target.value)}
                                    onKeyPress={handleKeyPress}
                                    placeholder="Enter 6-digit PIN"
                                    className="line-input"
                                />
                            </div>

                            <button
                                onClick={handleVerifyCredentials}
                                className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition"
                            >
                                Sign In
                            </button>
                            <button
                                onClick={handleBackToHome}
                                className="w-full text-gray-600 text-sm hover:text-gray-800"
                            >
                                ← Back
                            </button>
                        </div>
                    </div>
                )}

                {/* ── AUTHENTICATED / REDIRECTING ── */}
                {authState === 'authenticated' && (
                    <div className="space-y-6">
                        <div className="text-center">
                            <h1 className="text-2xl font-bold text-gray-800">Redirecting...</h1>
                            <p className="text-gray-600 mt-2">Taking you to your dashboard</p>
                        </div>
                    </div>
                )}
            </div>

            {/* ── NEW PIN MODAL ── */}
            {showNewPin && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full">
                        <div className="text-center space-y-4">
                            <h2 className="text-2xl font-bold text-gray-800">Account Created!</h2>
                            <p className="text-gray-600">Your credentials are:</p>

                            <div className="bg-gray-50 border-2 border-gray-300 rounded-lg p-6 space-y-3">
                                <div>
                                    <p className="text-sm text-gray-600 mb-1">Email:</p>
                                    <div className="text-lg font-semibold text-blue-600">
                                        {newlyCreatedEmail}
                                    </div>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-600 mb-1">PIN:</p>
                                    <div className="text-4xl font-bold text-blue-600 tracking-wider mb-3">
                                        {newlyCreatedPin}
                                    </div>
                                </div>
                                <button
                                    onClick={handleCopyPin}
                                    className="flex items-center justify-center gap-2 text-sm text-gray-600 hover:text-gray-800 mx-auto"
                                >
                                    {copied ? (
                                        <>
                                            <Check className="w-4 h-4" />
                                            <span className="text-green-600">Copied PIN!</span>
                                        </>
                                    ) : (
                                        <>
                                            <Copy className="w-4 h-4" />
                                            Copy PIN
                                        </>
                                    )}
                                </button>
                            </div>

                            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-sm text-yellow-800">
                                ⚠️ Save both your email and PIN. You'll need both to sign in.
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