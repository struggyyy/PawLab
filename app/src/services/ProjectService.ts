import { Project } from "../models/Project";
import { User as AppUser } from "../models/User";
import { supabase } from "../lib/supabase";

// Type for the raw data item expected from the Supabase query
interface RawProjectMember {
  user_id: string;
  role: "editor" | "viewer";
  profiles: AppUser[] | null;
}

// Type for the processed project member data to be returned by the service
export type ProjectMemberData = {
  user_id: string;
  role: "editor" | "viewer";
  profile: AppUser | null;
};

class ProjectService {
  constructor() {
    // Remove localStorage initialization logic
  }

  async getProjects(): Promise<Project[]> {
    try {
      const { data, error } = await supabase.from("projects").select("*");

      if (error) {
        console.error("Error retrieving projects:", error);
        return [];
      }
      return data || [];
    } catch (err) {
      console.error("Exception retrieving projects:", err);
      return [];
    }
  }

  async getProjectById(projectId: string): Promise<Project | null> {
    try {
      const { data, error } = await supabase
        .from("projects")
        .select("*")
        .eq("id", projectId)
        .single();

      if (error) {
        // If the error is specifically because no rows were found by .single(),
        // this is not necessarily an "error" in all contexts (e.g., checking existence or verifying delete).
        // PGRST116 is the PostgREST error code for "Requested range not satisfiable" which .single() can trigger.
        if (error.code === "PGRST116") {
          // console.log(`Project with ID ${projectId} not found (PGRST116). Returning null.`); // Optional: more specific log for debug
          return null;
        } else {
          // For other errors, log them as they might be more critical.
          console.error(`Error fetching project by ID ${projectId}:`, error);
          return null;
        }
      }
      return data;
    } catch (err) {
      console.error(`Exception fetching project by ID ${projectId}:`, err);
      return null;
    }
  }

  async addProject(
    projectData: Omit<Project, "id" | "created_at" | "owner_id">
  ): Promise<Project | null> {
    const {
      data: { user: authUser },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !authUser) {
      console.error(
        "Error fetching authenticated user or user not authenticated:",
        authError
      );
      return null;
    }
    const ownerIdToInsert = authUser.id;

    try {
      const { data, error } = await supabase
        .from("projects")
        .insert([
          {
            ...projectData,
            owner_id: ownerIdToInsert,
          },
        ])
        .select()
        .single();
      if (error) {
        console.error(
          "Error adding project (Supabase error object):",
          JSON.stringify(error, null, 2)
        );
        console.error("Full error object:", error);
        return null;
      }
      return data;
    } catch (err) {
      console.error("Exception adding project:", err);
      return null;
    }
  }

  async updateProject(
    projectId: string,
    updatedProjectData: Partial<Omit<Project, "id" | "created_at" | "owner_id">>
  ): Promise<Project | null> {
    console.log(
      `Attempting to update project ${projectId} with data:`,
      updatedProjectData
    );
    try {
      const { error: updateError } = await supabase
        .from("projects")
        .update(updatedProjectData)
        .eq("id", projectId);

      if (updateError) {
        console.error(
          `Error during Supabase update operation for project ${projectId}:`,
          updateError
        );
        // Attempt to provide a more specific reason if known RLS failure codes
        if (
          updateError.code === "42501" ||
          updateError.message.includes("RLS policy")
        ) {
          // 42501 is permission denied
          alert(
            `Failed to update project: You may not have the required permissions. (RLS) ${updateError.message}`
          );
        } else {
          alert(
            `Failed to update project due to a database error: ${updateError.message}`
          );
        }
        return null;
      }

      // If no error, the update request was accepted by the database.
      // Now, fetch the project to confirm the update and get the latest data.
      // This also verifies RLS SELECT permission.
      console.log(
        `Update request for project ${projectId} sent successfully. Re-fetching project...`
      );
      const updatedProject = await this.getProjectById(projectId);

      if (updatedProject) {
        console.log(
          `Project ${projectId} successfully updated and re-fetched:`,
          updatedProject
        );
        // Optional: Check if updatedProjectData fields are reflected in updatedProject
        // This is more for sanity checking than a hard failure.
        const nameMatch = updatedProjectData.name
          ? updatedProject.name === updatedProjectData.name
          : true;
        const descriptionMatch =
          updatedProjectData.description !== undefined
            ? updatedProject.description === updatedProjectData.description
            : true;
        if (!nameMatch || !descriptionMatch) {
          console.warn(
            `Project ${projectId} re-fetched, but updated fields don't perfectly match the input. This might be due to transformations or delays. UI should still reflect re-fetched data.`
          );
        }
        return updatedProject;
      } else {
        console.warn(
          `Project ${projectId} was not found after an update attempt. This could mean the update caused it to become inaccessible due to RLS, or it was deleted concurrently.`
        );
        alert(
          "Project data could not be retrieved after update. It might be inaccessible."
        );
        return null;
      }
    } catch (err: unknown) {
      console.error(
        `Exception in updateProject for project ${projectId}:`,
        err
      );
      alert(
        `An unexpected error occurred while updating the project: ${
          err instanceof Error ? err.message : "Unknown error"
        }`
      );
      return null;
    }
  }

  async deleteProject(id: string): Promise<boolean> {
    console.log(`Attempting to delete project ${id}`);
    try {
      const { error: deleteError, count } = await supabase
        .from("projects")
        .delete()
        .eq("id", id);

      if (deleteError) {
        console.error(
          `Error during Supabase delete operation for project ${id}:`,
          deleteError
        );
        if (
          deleteError.code === "42501" ||
          deleteError.message.includes("RLS policy")
        ) {
          alert(
            `Failed to delete project: You may not have the required permissions. (RLS) ${deleteError.message}`
          );
        } else {
          alert(
            `Failed to delete project due to a database error: ${deleteError.message}`
          );
        }
        return false;
      }

      console.log(
        `Supabase delete request for project ${id} completed. Response count: ${count}. Verifying deletion...`
      );

      // Verify deletion by trying to fetch the project.
      const projectAfterDelete = await this.getProjectById(id);
      if (projectAfterDelete === null) {
        console.log(
          `Project ${id} confirmed deleted (not found after delete attempt).`
        );
        return true;
      } else {
        // This case means the RLS policy prevented the delete for the current user,
        // or the delete operation didn't target any rows.
        console.warn(
          `Project ${id} still found after delete attempt. RLS likely prevented actual deletion, or project ID was incorrect.`
        );
        alert(
          "Failed to delete project. You may not have permission, or the project still exists."
        );
        return false;
      }
    } catch (err: unknown) {
      console.error(`Exception in deleteProject for project ${id}:`, err);
      alert(
        `An unexpected error occurred while deleting the project: ${
          err instanceof Error ? err.message : "Unknown error"
        }`
      );
      return false;
    }
  }

  async getProjectMembers(projectId: string): Promise<ProjectMemberData[]> {
    try {
      const { data, error } = await supabase
        .from("project_users")
        .select(
          `
                    user_id,
                    role,
                    profiles!inner ( id, first_name, last_name, role )
                `
        )
        .eq("project_id", projectId);

      if (error) {
        console.error("Error fetching project members:", error);
        return [];
      }

      if (!data) {
        return [];
      }
      // Cast the data from Supabase to our RawProjectMember array type then map.
      // Supabase client might return 'any' or a loosely typed structure.
      return (data as RawProjectMember[]).map((item: RawProjectMember) => ({
        user_id: item.user_id,
        role: item.role,
        profile:
          item.profiles && item.profiles.length > 0 ? item.profiles[0] : null,
      }));
    } catch (err) {
      console.error("Exception fetching project members:", err);
      return [];
    }
  }

  async addUserToProject(
    projectId: string,
    userId: string,
    role: "editor" | "viewer"
  ): Promise<boolean> {
    // RLS on project_users table should allow project owner to add members.
    try {
      const { error } = await supabase
        .from("project_users")
        .insert([{ project_id: projectId, user_id: userId, role: role }]);

      if (error) {
        console.error("Error adding user to project:", error);
        return false;
      }
      return true;
    } catch (err) {
      console.error("Exception adding user to project:", err);
      return false;
    }
  }

  async removeUserFromProject(
    projectId: string,
    userId: string
  ): Promise<boolean> {
    // RLS on project_users table should allow project owner to remove members.
    try {
      const { error } = await supabase
        .from("project_users")
        .delete()
        .eq("project_id", projectId)
        .eq("user_id", userId);

      if (error) {
        console.error("Error removing user from project:", error);
        return false;
      }
      return true;
    } catch (err) {
      console.error("Exception removing user from project:", err);
      return false;
    }
  }

  async updateUserRoleInProject(
    projectId: string,
    userId: string,
    newRole: "editor" | "viewer"
  ): Promise<boolean> {
    // RLS on project_users table should allow project owner to update roles.
    try {
      const { error } = await supabase
        .from("project_users")
        .update({ role: newRole })
        .eq("project_id", projectId)
        .eq("user_id", userId);

      if (error) {
        console.error("Error updating user role in project:", error);
        return false;
      }
      return true;
    } catch (err) {
      console.error("Exception updating user role in project:", err);
      return false;
    }
  }

  // Task-related methods (getTasks, addTask, updateTask, deleteTask) are REMOVED.
  // They will be in TaskService.ts and StoryService.ts as appropriate.
}

const projectServiceInstance = new ProjectService();
export default projectServiceInstance;
