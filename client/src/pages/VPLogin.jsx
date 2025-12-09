import { SignedIn, SignedOut, SignInButton, useAuth, useClerk } from "@clerk/clerk-react";
import { useEffect } from "react";
import { useAuth0 } from "@auth0/auth0-react";
import { useNavigate } from "react-router-dom";

export default function VPLogin() {
    const { isLoading, isAuthenticated, loginWithRedirect, logout, user } = useAuth0();
    const navigate = useNavigate();

    // Sign out on fresh page load (not refreshes)
    useEffect(() => {
        const wasOpen = sessionStorage.getItem('appWasOpen');
        
        if (!wasOpen && isAuthenticated) {
            // App was closed and reopened - sign out
            logout({ logoutParams: { returnTo: window.location.origin } });
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
    }, [isAuthenticated, logout]);

    // Redirect to dashboard when user signs in
    useEffect(() => {
        if (!isLoading && isAuthenticated) {
            navigate('/vp/dashboard');
        }
    }, [isLoading, isAuthenticated, navigate]);

    const handleLogin = () => {
        loginWithRedirect();
    };

    return (
        <div style={{ padding: 20 }}>
            <h1>Vice-Principal Login</h1>
            
            {!isAuthenticated && !isLoading && (
                <>
                    <p>Please sign in to continue</p>
                    <button onClick={handleLogin}>Sign In</button>
                </>
            )}

            {isAuthenticated && (
                <p>Redirecting to dashboard...</p>
            )}

            {isLoading && (
                <p>Loading...</p>
            )}
        </div>
    );
}