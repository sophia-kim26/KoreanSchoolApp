import React from 'react';
import { Copy, Check } from 'lucide-react';

interface NewPinModalProps {
    email: string;
    pin: string;
    copied: boolean;
    onCopyPin: () => void;
    onGoToSignIn: () => void;
    onClose: () => void;
}

export function NewPinModal({ 
    email, 
    pin, 
    copied, 
    onCopyPin, 
    onGoToSignIn, 
    onClose 
}: NewPinModalProps) {
    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full">
                <div className="text-center space-y-4">
                    <h2 className="text-2xl font-bold text-gray-800">Account Created!</h2>
                    <p className="text-gray-600">Your credentials are:</p>

                    <div className="bg-gray-50 border-2 border-gray-300 rounded-lg p-6 space-y-3">
                        <div>
                            <p className="text-sm text-gray-600 mb-1">Email:</p>
                            <div className="text-lg font-semibold text-blue-600">
                                {email}
                            </div>
                        </div>
                        <div>
                            <p className="text-sm text-gray-600 mb-1">PIN:</p>
                            <div className="text-4xl font-bold text-blue-600 tracking-wider mb-3">
                                {pin}
                            </div>
                        </div>
                        <button
                            onClick={onCopyPin}
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
                            onClick={onGoToSignIn}
                            className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition"
                        >
                            Sign In Now
                        </button>
                        <button
                            onClick={onClose}
                            className="w-full text-gray-600 text-sm hover:text-gray-800"
                        >
                            Close
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}