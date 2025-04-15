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
    private actualGuestUser: AppUser | null = null; // Stores the actual guest user data

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
            if (this.isAuthenticated && authUser) {
                // Check if this is an OAuth user (Google)
                if (authUser.app_metadata?.provider === 'google') {
                    // Create a guest user from Google auth
                    const oauthUser: AppUser = {
                        id: authUser.id,
                        firstName: authUser.user_metadata?.full_name?.split(' ')[0] || 'Guest',
                        lastName: authUser.user_metadata?.full_name?.split(' ').slice(1).join(' ') || 'User',
                        role: 'guest'
                    };
                    
                    // Store the actual guest user
                    this.actualGuestUser = oauthUser;
                    
                    // Set as current user
                    this.currentUser = oauthUser;
                    
                    // Store in localStorage
                    if (isBrowser) {
                        localStorage.setItem(this.storageKey, JSON.stringify(this.currentUser));
                    }
                } else {
                    // For now, we'll just use the existing user data for email/password login
                    // In a real app, you would fetch user details from your database
                    console.log('Authenticated as:', authUser?.email);
                }
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
        // Find the user by ID
        const user = this.users.find(u => u.id === userId);
        
        if (user) {
            // If the current user is a guest (logged in with Google), 
            // we'll allow them to "see as" any user but maintain their guest role restrictions
            if (this.isUserGuest()) {
                // Store the selected user but maintain guest role for permission checks
                this.currentUser = {
                    ...user,
                    // Preserve the actual guest user ID for role-checking purposes
                    _guestActingAs: true
                };
            } else {
                // Normal user switching behavior
                this.currentUser = user;
            }
            
            // Save the current user selection
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
    
    isUserGuest(): boolean {
        // Check if this user logged in with Google OAuth
        return this.isAuthenticated && 
               (this.actualGuestUser !== null || 
               (this.currentUser && this.currentUser.role === 'guest'));
    }
    
    hasWritePermission(): boolean {
        // If they're a guest user (even if they're "viewing as" another user),
        // they still don't have write permission
        return this.isAuthenticated && !this.isUserGuest();
    }
}

const userService = new UserService();

export default userService;