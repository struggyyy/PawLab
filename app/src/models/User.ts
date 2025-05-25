export interface User {
  id: string; // Corresponds to auth.users.id and profiles.id (UUID)
  firstName?: string | null; // From profiles.first_name
  lastName?: string | null; // From profiles.last_name
  role: "admin" | "developer" | "devops" | "guest"; // From profiles.role
  updated_at?: string | Date; // From profiles.updated_at
  _guestActingAs?: boolean; // Client-side flag, can remain
}
