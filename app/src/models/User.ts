export interface User {
    id: string;
    firstName: string;
    lastName: string;
    role: 'admin' | 'developer' | 'devops' | 'guest';
    _guestActingAs?: boolean; // Optional flag to indicate a guest user acting as another user
}