import { User } from '../models/User';

const isBrowser = typeof window !== 'undefined';

class UserService {
    private users: User[] = [
        { id: '1', firstName: 'Jan', lastName: 'Kowalski', role: 'admin' },
        { id: '2', firstName: 'Anna', lastName: 'Nowak', role: 'developer' },
        { id: '3', firstName: 'Piotr', lastName: 'Zalewski', role: 'devops' },
    ];
    private currentUser: User;
    private storageKey = 'currentUser';

    constructor() {
        // Default to admin user first
        this.currentUser = this.users[0];
        
        // Try to get current user from localStorage only in browser
        if (isBrowser) {
            const storedUser = localStorage.getItem(this.storageKey);
            if (storedUser) {
                try {
                    this.currentUser = JSON.parse(storedUser);
                } catch {
                    console.error('Failed to parse user from localStorage');
                }
            } else {
                localStorage.setItem(this.storageKey, JSON.stringify(this.currentUser));
            }
        }
    }

    getUser(): User {
        return this.currentUser;
    }

    setUser(userId: string): void {
        const user = this.users.find(u => u.id === userId);
        if (user) {
            this.currentUser = user;
            if (isBrowser) {
                localStorage.setItem(this.storageKey, JSON.stringify(this.currentUser));
            }
        }
    }

    getUsers(): User[] {
        return this.users;
    }
}

const userService = new UserService();

export default userService;