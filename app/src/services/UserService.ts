import { User as AppUser } from '../models/User';
import { getCurrentUser } from '../../lib/supabase';

const isBrowser = typeof window !== 'undefined';

class UserService {
    private users: AppUser[] = [
        { id: '1', firstName: 'Jan', lastName: 'Kowalski', role: 'admin' },
        { id: '2', firstName: 'Anna', lastName: 'Nowak', role: 'developer' },
        { id: '3', firstName: 'Piotr', lastName: 'Zalewski', role: 'devops' },
    ];
    private currentUser: AppUser;
    private storageKey = 'currentUser';
    private isAuthenticated = false;

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

        // Check authentication
        this.checkAuthentication();
    }

    async checkAuthentication() {
        try {
            const authUser = await getCurrentUser();
            this.isAuthenticated = !!authUser;
            
            // If authenticated, map the auth user to our internal user
            if (this.isAuthenticated) {
                // For now, we'll just use the existing user data
                // In a real app, you would fetch user details from your database
                console.log('Authenticated as:', authUser?.email);
            }
        } catch (error) {
            console.error('Error checking authentication:', error);
            this.isAuthenticated = false;
        }
    }

    getUser(): AppUser {
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

    getUsers(): AppUser[] {
        return this.users;
    }

    isUserAuthenticated(): boolean {
        return this.isAuthenticated;
    }
}

const userService = new UserService();

export default userService;