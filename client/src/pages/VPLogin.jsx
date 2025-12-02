import { SignedIn, SignedOut, SignInButton, useAuth, useClerk } from "@clerk/clerk-react";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";

export default function VPLogin() {
    const { isLoaded, userId } = useAuth();
    const { signOut } = useClerk();
    const navigate = useNavigate();

    // Sign out on fresh page load (not refreshes)
    useEffect(() => {
        const wasOpen = sessionStorage.getItem('appWasOpen');
        
        if (!wasOpen && userId) {
            // App was closed and reopened - sign out
            signOut();
        } else {
            // Mark app as open
            sessionStorage.setItem('appWasOpen', 'true');
        }

        // Clean up on unload
        const handleBeforeUnload = () => {
            sessionStorage.removeItem('appWasOpen');
        };

        window.addEventListener('beforeunload', handleBeforeUnload);
        
        return () => {
            window.removeEventListener('beforeunload', handleBeforeUnload);
        };
    }, [userId, signOut]);

    // Redirect to dashboard when user signs in
    useEffect(() => {
        if (isLoaded && userId) {
            navigate('/vp/dashboard');
        }
    }, [isLoaded, userId, navigate]);

    return (
        <div style={{ padding: 20 }}>
            <h1>Vice-Principal Login</h1>
            
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