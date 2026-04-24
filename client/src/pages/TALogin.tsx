import React, { useState, useRef } from 'react';
import { useNavigate, NavigateFunction } from 'react-router-dom';
import { useAuth0 } from "@auth0/auth0-react";
import './style/global.css';
import logo from '../assets/logo.png';

// Imports from our newly split files
import { AuthState, TAUser, SignInResponse, CreateAccountResponse } from './TALoginTypes';
import { CLASSROOMS } from './TALoginConstants';
import { NewPinModal } from './TALoginModals';

export default function TALogin(): React.ReactElement {
    const navigate: NavigateFunction = useNavigate();
    const { logout } = useAuth0();

    const [authState, setAuthState] = useState<AuthState>('home');
    const [email, setEmail] = useState<string>('');
    const [pin, setPin] = useState<string>('');
    const [currentUser, setCurrentUser] = useState<TAUser | null>(null);
    const [error, setError] = useState<string>('');
    
    // Modal states
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

    const handlePinChange = (value: string): void => {
        const numericValue = value.replace(/\D/g, '').slice(0, 6);
        setPin(numericValue);
    };

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
            const response = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/signin`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json'},
                body: JSON.stringify({
                    email: email.trim(),
                    ta_code: pin
                })
            });

            const data: SignInResponse = await response.json();

            if (!response.ok) {
                setError(data.error || 'Invalid email or PIN. Please try again.');
                setPin('');
                setTimeout(() => pinInputRef.current?.focus(), 100);
                return;
            }

            if (data.success && data.ta) {
                const taUser = data.token ? { ...data.ta, token: data.token } : data.ta;
                setCurrentUser(taUser);
                localStorage.setItem('current_ta_user', JSON.stringify(taUser));
                if (data.token) {
                    localStorage.setItem('ta_token', data.token);
                }
                sessionStorage.removeItem('ta_session_ended');
                setAuthState('authenticated');
                setError('');
                setTimeout(() => navigate('/ta/dashboard'), 0);
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
            const response = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/create-account`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json'},
                body: JSON.stringify({
                    first_name: firstName,
                    last_name: lastName,
                    email: formEmail.trim(),
                    ta_code: newPin,
                    session_day: sessionDay,
                    classroom: classroom || null
                })
            });

            const data: CreateAccountResponse = await response.json();

            if (!response.ok) {
                setError(data.error || 'Failed to create account');
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

    const handleKeyPress = (e: React.KeyboardEvent): void => {
        if (e.key === 'Enter' && authState === 'enterCredentials') {
            handleVerifyCredentials();
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
                                onClick={() => {
                                    setAuthState('enterCredentials');
                                    setTimeout(() => emailInputRef.current?.focus(), 100);
                                }}
                                className="w-full bg-blue-600 text-white py-4 rounded-lg font-semibold hover:bg-blue-700 transition flex items-center justify-center gap-2"
                            >
                                Sign In
                            </button>
                            <button
                                onClick={handleCreateAccount}
                                className="w-full bg-white border-2 border-gray-300 text-gray-700 py-4 rounded-lg font-semibold hover:bg-gray-50 transition flex items-center justify-center gap-2"
                            >
                                Create New Account
                            </button>
                            <div className="flex justify-center">
                                <button onClick={handleBack} className="btn-danger">
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

            {/* ── NEW PIN MODAL COMPONENT ── */}
            {showNewPin && (
                <NewPinModal 
                    email={newlyCreatedEmail}
                    pin={newlyCreatedPin}
                    copied={copied}
                    onCopyPin={handleCopyPin}
                    onGoToSignIn={handleGoToSignIn}
                    onClose={handleCloseNewPin}
                />
            )}
        </div>
    );
}