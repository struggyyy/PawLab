import { User as AppUser } from "../models/User";
import { supabase, getCurrentUser as getAuthUser } from "../lib/supabase";

// Define a type for the profile update payload to avoid 'any'
// This should map to columns in your 'profiles' table
type ProfileUpdatePayload = {
  first_name?: string | null;
  last_name?: string | null;
  role?: "admin" | "developer" | "devops" | "guest" | null;
  updated_at?: string;
};

class UserService {
  private currentUserProfile: AppUser | null = null;
  private isAuthenticated = false;
  private authUserId: string | null = null;

  private onProfileUpdateCallbacks: Array<(profile: AppUser | null) => void> =
    [];

  constructor() {
    // Listen to Supabase auth changes
    supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" && session?.user) {
        this.isAuthenticated = true;
        this.authUserId = session.user.id;
        this.loadUserProfile(session.user.id);
      } else if (event === "SIGNED_OUT") {
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
        .from("profiles")
        .select("id, first_name, last_name, role, updated_at")
        .eq("id", userId)
        .single();

      let newProfile: AppUser | null = null;
      if (error && status !== 406) {
        console.error("Error fetching user profile:", error);
        newProfile = null;
      } else if (data) {
        newProfile = {
          id: data.id,
          firstName: data.first_name,
          lastName: data.last_name,
          role: data.role || "guest",
          updated_at: data.updated_at,
        };
      } else {
        console.warn(
          `Profile not found for user ${userId}, using minimal profile.`
        );
        const authUser = await getAuthUser(); // Get email from auth user
        newProfile = {
          id: userId,
          firstName: authUser?.email?.split("@")[0] || "User",
          lastName: "",
          role: "guest", // Default role
        };
      }
      // Only notify if the profile has actually changed to avoid unnecessary updates
      if (
        JSON.stringify(this.currentUserProfile) !== JSON.stringify(newProfile)
      ) {
        this.currentUserProfile = newProfile;
        this.notifyProfileUpdate();
      } else if (!this.currentUserProfile && newProfile) {
        // Case where current is null and new one is fetched
        this.currentUserProfile = newProfile;
        this.notifyProfileUpdate();
      }
    } catch (err) {
      console.error("Exception fetching user profile:", err);
      if (this.currentUserProfile !== null) {
        // Only notify if there's a change
        this.currentUserProfile = null;
        this.notifyProfileUpdate();
      }
    }
  }

  public getCurrentUserProfile(): AppUser | null {
    return this.currentUserProfile;
  }

  async getAllUsers(): Promise<AppUser[]> {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, first_name, last_name, role, updated_at");

      if (error) {
        console.error("Error fetching all users:", error);
        return [];
      }
      return (
        data.map((profile) => ({
          id: profile.id,
          firstName: profile.first_name,
          lastName: profile.last_name,
          role: profile.role || "guest",
          updated_at: profile.updated_at,
        })) || []
      );
    } catch (err) {
      console.error("Exception fetching all users:", err);
      return [];
    }
  }

  /**
   * Updates the current user's profile in the 'profiles' table.
   * Only allows updating fields like first_name, last_name. Role changes would typically be admin-only.
   */
  async updateUserProfile(
    userId: string,
    updates: ProfileUpdatePayload
  ): Promise<AppUser | null> {
    // Ensure the user can only update their own profile unless they are an admin
    // This client-side check is a good first guard, but RLS is the true enforcer
    const currentUser = await this.getCurrentUserProfile();
    if (!currentUser) {
      console.error("No current user found, cannot update profile.");
      return null;
    }

    if (currentUser.id !== userId && currentUser.role !== "admin") {
      console.error("User does not have permission to update this profile.");
      // Or throw an error / return an error object
      return null;
    }

    const { data, error } = await supabase
      .from("profiles")
      .update(updates)
      .eq("id", userId)
      .select()
      .single();

    if (error) {
      console.error("Error updating user profile:", error);
      return null;
    }
    if (data && currentUser.id === userId) {
      this.currentUserProfile = data as AppUser; // Update local cache if it's the current user
      this.onProfileUpdateCallbacks.forEach((cb) =>
        cb(this.currentUserProfile)
      );
    }
    return data as AppUser;
  }

  /**
   * Admin function to update any user's role or other details.
   * This should be protected and only callable by an admin user in your UI.
   * The RLS policies for the 'profiles' table would need to allow admins to update other users.
   * For now, our 'profiles' RLS only allows users to update their own.
   * This is a placeholder for future admin functionality.
   */
  async adminUpdateUser(
    userIdToUpdate: string,
    updates: ProfileUpdatePayload
  ): Promise<AppUser | null> {
    // This method assumes the calling user is an admin.
    // Frontend should verify admin role before calling this.
    // RLS policies on Supabase are the ultimate enforcer.
    const { data, error } = await supabase
      .from("profiles")
      .update(updates)
      .eq("id", userIdToUpdate)
      .select()
      .single();

    if (error) {
      console.error("Error (admin) updating user profile:", error);
      // Consider throwing an error or returning a more specific error object
      return null;
    }
    // If the admin updated the currently logged-in user's profile, update the local cache.
    if (
      this.currentUserProfile &&
      this.currentUserProfile.id === userIdToUpdate
    ) {
      this.currentUserProfile = {
        ...this.currentUserProfile,
        ...updates,
      } as AppUser;
      this.onProfileUpdateCallbacks.forEach((cb) =>
        cb(this.currentUserProfile)
      );
    }
    return data as AppUser;
  }

  isUserAuthenticated(): boolean {
    return this.isAuthenticated;
  }

  // The concept of "guest" is now primarily driven by the 'role' in the profile.
  // The original `isUserGuest` checked for OAuth or 'guest' role in a local object.
  // Now, we can directly check the role from the loaded profile.
  isUserGuest(): boolean {
    return this.currentUserProfile?.role === "guest";
  }

  // Permissions are now primarily handled by Supabase RLS.
  // This client-side check can supplement RLS or be used for UI hinting.
  // More complex permissions (e.g., project-specific roles) will be checked server-side by RLS.
  hasWritePermission(): boolean {
    if (!this.isAuthenticated || !this.currentUserProfile) return false;
    // Deny write if role is 'guest'.
    if (this.currentUserProfile.role === "guest") {
      return false;
    }
    // For any other role, assume write permission for now from client-side perspective.
    // RLS will be the ultimate gatekeeper.
    return true;
  }

  public onProfileUpdate(
    callback: (profile: AppUser | null) => void
  ): () => void {
    this.onProfileUpdateCallbacks.push(callback);
    // Optionally, call immediately with current state if needed by subscriber
    // callback(this.currentUserProfile);
    return () => {
      this.onProfileUpdateCallbacks = this.onProfileUpdateCallbacks.filter(
        (cb) => cb !== callback
      );
    };
  }

  private notifyProfileUpdate() {
    this.onProfileUpdateCallbacks.forEach((cb) => cb(this.currentUserProfile));
  }
}

const userService = new UserService();
export default userService;
