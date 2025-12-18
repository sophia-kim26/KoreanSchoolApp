import { useAuth0 } from "@auth0/auth0-react";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";
import './style/global.css'
import logo from '../assets/logo.png';

export default function VPLogin() {
    const { isLoading, isAuthenticated, loginWithRedirect, logout, user } = useAuth0();
    const navigate = useNavigate();

    useEffect(() => {
        sessionStorage.setItem('appWasOpen', 'true');

        // Clean up on unload
        const handleBeforeUnload = () => {
            sessionStorage.removeItem('appWasOpen');
        };

        window.addEventListener('beforeunload', handleBeforeUnload);
        
        return () => {
            window.removeEventListener('beforeunload', handleBeforeUnload);
        };
    }, []);

    // Redirect to dashboard when user signs in
    useEffect(() => {
        if (!isLoading && isAuthenticated) {
            navigate('/vp/dashboard');
        }
    }, [isLoading, isAuthenticated, navigate]);

    const handleLogin = () => {
        loginWithRedirect({
            authorizationParams: {
                redirect_uri: window.location.origin + '/vp/login'
            }
        });
    };

    return (
        <div style={{ padding: 20 }}>
            <div className="logo">
                <img src={logo} alt="Logo" />
            </div>
            
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