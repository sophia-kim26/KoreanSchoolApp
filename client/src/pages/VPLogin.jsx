import { SignedIn, SignedOut, SignInButton, SignOutButton, UserButton, useAuth } from "@clerk/clerk-react";

export default function App() {
    const { isLoaded, userId } = useAuth();

    return (
        <div style={{ padding: 20 }}>
        <h1>Vice-Principal side</h1>
        <div style={{ background: '#f0f0f0', padding: 10, marginBottom: 20 }}>
            <p>Is Loaded: {isLoaded ? 'Yes' : 'No'}</p>
            <p>User ID: {userId || 'None'}</p>
        </div>

        <SignedOut>
            <p>You are signed out</p>
            <SignInButton />
        </SignedOut>

        <SignedIn>
            <p>You are signed in!</p>
            <UserButton />
            <SignOutButton />
        </SignedIn>
        </div>
    );
}