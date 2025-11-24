import { SignedIn, SignedOut, SignInButton, SignOutButton, UserButton, useAuth } from "@clerk/clerk-react";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";

export default function VPLogin() {
    console.log('🔵 VPLogin component rendering!');
    const { isLoaded, userId } = useAuth();
    const navigate = useNavigate();
    console.log('🔵 VPLogin auth state:', { isLoaded, userId });

    // Redirect to dashboard when user signs in
    useEffect(() => {
        if (isLoaded && userId) {
            navigate('/vp/dashboard');
        }
    }, [isLoaded, userId, navigate]);

    return (
        <div style={{ padding: 20 }}>
        <h1>Vice-Principal Login</h1>
        <div style={{ background: '#f0f0f0', padding: 10, marginBottom: 20 }}>
            <p>Is Loaded: {isLoaded ? 'Yes' : 'No'}</p>
            <p>User ID: {userId || 'None'}</p>
        </div>

        <SignedOut>
            <p>Please sign in to continue</p>
            <SignInButton mode="modal" />
        </SignedOut>

        <SignedIn>
            <p>Redirecting to dashboard...</p>
        </SignedIn>
        </div>
    );
}