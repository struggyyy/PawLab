export interface User {
    id: string;
    firstName: string;
    lastName: string;
    role: 'admin' | 'developer' | 'devops';
}