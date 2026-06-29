export interface LoginCredentials {
    email: string;
    password: string;
    shouldRememberUser: boolean;
}

export type AuthResult =
    | { status: 'success'; token: string; rol: string; nombre: string; user: { email: string } }
    | { status: 'invalid_credentials'; message: string }
    | { status: 'server_error'; errorCode: number };
