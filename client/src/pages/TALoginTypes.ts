export type AuthState = 'home' | 'enterCredentials' | 'authenticated' | 'createAccountForm';

export interface TAUser {
    id: number;
    first_name: string;
    last_name: string;
    email: string;
    ta_code?: string;
    session_day: string;
    classroom?: string;
    token?: string;
}

export interface SignInResponse {
    success: boolean;
    ta?: TAUser;
    token?: string;
    error?: string;
}

export interface CreateAccountResponse {
    success: boolean;
    error?: string;
}