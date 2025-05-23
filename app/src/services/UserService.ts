import { User as AppUser } from '../models/User';
import { supabase, getCurrentUser as getAuthUser } from '../../lib/supabase'; // Assuming supabase client is exported

// const isBrowser = typeof window !== 'undefined'; // No longer needed for localStorage

// Define a type for the profile update payload to avoid 'any'
// This should map to columns in your 'profiles' table
type ProfileUpdatePayload = {
    first_name?: string | null;
    last_name?: string | null;
    role?: 'admin' | 'developer' | 'devops' | 'guest' | null;
    updated_at?: string;
};

class UserService {
    // private users: AppUser[] = [ ... ]; // Remove hardcoded users
    private currentUserProfile: AppUser | null = null;
    private isAuthenticated = false;
    private authUserId: string | null = null;

    private onProfileUpdateCallbacks: Array<(profile: AppUser | null) => void> = [];

    constructor() {
        // Listen to Supabase auth changes
        supabase.auth.onAuthStateChange((event, session) => {
            if (event === 'SIGNED_IN' && session?.user) {
                this.isAuthenticated = true;
                this.authUserId = session.user.id;
                this.loadUserProfile(session.user.id);
            } else if (event === 'SIGNED_OUT') {
                this.isAuthenticated = false;
                this.currentUserProfile = null;
                this.authUserId = null;
                this.notifyProfileUpdate();
            }
        });
        // Initial check
        this.initializeCurrentUser();
    }

    private async initializeCurrentUser() {
        const authUser = await getAuthUser();
        if (authUser) {
            this.isAuthenticated = true;
            this.authUserId = authUser.id;
            await this.loadUserProfile(authUser.id);
        } else {
            this.isAuthenticated = false;
            this.currentUserProfile = null;
            this.authUserId = null;
            this.notifyProfileUpdate();
        }
    }

    async loadUserProfile(userId: string): Promise<void> {
        try {
            const { data, error, status } = await supabase
                .from('profiles')
                .select('id, first_name, last_name, role, updated_at')
                .eq('id', userId)
                .single();

            let newProfile: AppUser | null = null;
            if (error && status !== 406) { // 406 can mean no row found, which is fine if profile not yet complete
                console.error('Error fetching user profile:', error);
                newProfile = null;
            } else if (data) {
                newProfile = {
                    id: data.id,
                    firstName: data.first_name,
                    lastName: data.last_name,
                    role: data.role || 'guest', // Default to guest if role is null
                    updated_at: data.updated_at,
                };
            } else {
                 // This can happen if the handle_new_user trigger hasn't run yet or failed
                 // Or if a user was created before the trigger was in place.
                 // For now, create a minimal profile or assume guest.
                 // A robust solution might try to create a profile entry here if one is missing.
                console.warn(`Profile not found for user ${userId}, using minimal profile.`);
                const authUser = await getAuthUser(); // Get email from auth user
                newProfile = {
                    id: userId,
                    firstName: authUser?.email?.split('@')[0] || 'User', // Basic default
                    lastName: '',
                    role: 'guest', // Default role
                };
            }
            // Only notify if the profile has actually changed to avoid unnecessary updates
            if (JSON.stringify(this.currentUserProfile) !== JSON.stringify(newProfile)) {
                this.currentUserProfile = newProfile;
                this.notifyProfileUpdate();
            } else if (!this.currentUserProfile && newProfile) { // Case where current is null and new one is fetched
                this.currentUserProfile = newProfile;
                this.notifyProfileUpdate();
            }
        } catch (err) {
            console.error('Exception fetching user profile:', err);
            if (this.currentUserProfile !== null) { // Only notify if there's a change
                this.currentUserProfile = null;
                this.notifyProfileUpdate();
            }
        }
    }

    public getCurrentUserProfile(): AppUser | null {
        return this.currentUserProfile;
    }
    
    // This method might need to be re-thought. 
    // "Setting" a user is now about who is logged in via Supabase.
    // If this was for admins to "view as" another user, that's a more complex feature.
    // For now, it's removed as direct user switching isn't standard with Supabase auth.
    /*
    setUser(userId: string): void {
        // Logic for switching user view (if still needed and re-designed for Supabase)
        // This would not change the authenticated user, but perhaps a "viewAs" state.
    }
    */

    async getAllUsers(): Promise<AppUser[]> {
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('id, first_name, last_name, role, updated_at');

            if (error) {
                console.error('Error fetching all users:', error);
                return [];
            }
            return data.map(profile => ({
                id: profile.id,
                firstName: profile.first_name,
                lastName: profile.last_name,
                role: profile.role || 'guest',
                updated_at: profile.updated_at,
            })) || [];
        } catch (err) {
            console.error('Exception fetching all users:', err);
            return [];
        }
    }
    
    /**
     * Updates the current user's profile in the 'profiles' table.
     * Only allows updating fields like first_name, last_name. Role changes would typically be admin-only.
     */
    async updateUserProfile(profileUpdates: Partial<Pick<AppUser, 'firstName' | 'lastName'>>): Promise<AppUser | null> {
        if (!this.authUserId) {
            console.error("User must be authenticated to update profile.");
            return null;
        }
        const updates: ProfileUpdatePayload = {
            updated_at: new Date().toISOString(),
        };
        if (profileUpdates.firstName !== undefined) updates.first_name = profileUpdates.firstName;
        if (profileUpdates.lastName !== undefined) updates.last_name = profileUpdates.lastName;

        try {
            const { data, error } = await supabase
                .from('profiles')
                .update(updates)
                .eq('id', this.authUserId)
                .select('id, first_name, last_name, role, updated_at')
                .single();

            if (error) {
                console.error('Error updating user profile:', error);
                return null;
            }
            if (data) {
                 const updatedProfile = {
                    id: data.id,
                    firstName: data.first_name,
                    lastName: data.last_name,
                    role: data.role || 'guest',
                    updated_at: data.updated_at,
                };
                if (JSON.stringify(this.currentUserProfile) !== JSON.stringify(updatedProfile)) {
                    this.currentUserProfile = updatedProfile;
                    this.notifyProfileUpdate();
                }
                return this.currentUserProfile;
            }
            return null;
        } catch (err) {
            console.error('Exception updating user profile:', err);
            return null;
        }
    }
    
    /**
     * Admin function to update any user's role or other details.
     * This should be protected and only callable by an admin user in your UI.
     * The RLS policies for the 'profiles' table would need to allow admins to update other users.
     * For now, our 'profiles' RLS only allows users to update their own.
     * This is a placeholder for future admin functionality.
     */
    async adminUpdateUser(userId: string, updates: Partial<AppUser>): Promise<AppUser | null> {
        console.warn("adminUpdateUser is not fully implemented with RLS for admin role yet.");
        // Example: You would need an RLS policy that allows users with 'admin' role to update any profile.
        // For now, this will likely fail unless the logged-in user is the target user due to RLS.
        const updateData: ProfileUpdatePayload = {
            updated_at: new Date().toISOString(),
        };
        if (updates.firstName !== undefined) updateData.first_name = updates.firstName;
        if (updates.lastName !== undefined) updateData.last_name = updates.lastName;
        if (updates.role !== undefined) updateData.role = updates.role;
        
        const { data, error } = await supabase
            .from('profiles')
            .update(updateData)
            .eq('id', userId)
            .select('id, first_name, last_name, role, updated_at') // Specified columns for clarity
            .single();
        
        if (error) {
            console.error("Error admin updating user:", error);
            return null;
        }
        // Assuming the select query fetches the needed fields if not generic select()
        if (data) {
            const newProfile = {
                id: data.id,
                firstName: data.first_name,
                lastName: data.last_name,
                role: data.role || 'guest',
                updated_at: data.updated_at,
            } as AppUser;
            // If this admin update affects the current logged-in user's profile
            if (this.currentUserProfile && this.currentUserProfile.id === userId) {
                 if (JSON.stringify(this.currentUserProfile) !== JSON.stringify(newProfile)) {
                    this.currentUserProfile = newProfile;
                    this.notifyProfileUpdate();
                }
            }
            return newProfile;
        }
        return null;
    }


    isUserAuthenticated(): boolean {
        return this.isAuthenticated;
    }
    
    // The concept of "guest" is now primarily driven by the 'role' in the profile.
    // The original `isUserGuest` checked for OAuth or 'guest' role in a local object.
    // Now, we can directly check the role from the loaded profile.
    isUserGuest(): boolean {
        return this.currentUserProfile?.role === 'guest';
    }
    
    // Permissions are now primarily handled by Supabase RLS.
    // This client-side check can supplement RLS or be used for UI hinting.
    // More complex permissions (e.g., project-specific roles) will be checked server-side by RLS.
    hasWritePermission(): boolean {
        if (!this.isAuthenticated || !this.currentUserProfile) return false;
        // Deny write if role is 'guest'.
        if (this.currentUserProfile.role === 'guest') {
            return false;
        }
        // For any other role, assume write permission for now from client-side perspective.
        // RLS will be the ultimate gatekeeper.
        return true;
    }

    public onProfileUpdate(callback: (profile: AppUser | null) => void): () => void {
        this.onProfileUpdateCallbacks.push(callback);
        // Optionally, call immediately with current state if needed by subscriber
        // callback(this.currentUserProfile); 
        return () => {
            this.onProfileUpdateCallbacks = this.onProfileUpdateCallbacks.filter(cb => cb !== callback);
        };
    }

    private notifyProfileUpdate() {
        this.onProfileUpdateCallbacks.forEach(cb => cb(this.currentUserProfile));
    }
}

const userService = new UserService();
// Ensure initial load is attempted when service is instantiated or app starts
// userService.loadUserProfile(); // This is handled by constructor's initializeCurrentUser

export default userService;