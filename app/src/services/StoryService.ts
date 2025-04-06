import { Story } from "../models/Story";

const isBrowser = typeof window !== 'undefined';

export class StoryService {
    private static storageKey = 'stories';

    static getStories(): Story[] {
        if (!isBrowser) return [];
        
        try {
            const storiesData = localStorage.getItem(this.storageKey);
            return storiesData ? JSON.parse(storiesData) : [];
        } catch (error) {
            console.error('Error retrieving stories:', error);
            return [];
        }
    }

    static getStoriesByProject(projectId: string): Story[] {
        return this.getStories().filter(story => story.projectId === projectId);
    }

    static getStoryById(storyId: string): Story | undefined {
        return this.getStories().find(story => story.id === storyId);
    }

    static createStory(story: Story): void {
        if (!isBrowser) return;
        
        const stories = this.getStories();
        stories.push(story);
        try {
            localStorage.setItem(this.storageKey, JSON.stringify(stories));
        } catch (error) {
            console.error('Error saving story:', error);
        }
    }

    static updateStory(updatedStory: Story): void {
        if (!isBrowser) return;
        
        const stories = this.getStories();
        const index = stories.findIndex(story => story.id === updatedStory.id);
        if (index !== -1) {
            stories[index] = updatedStory;
            try {
                localStorage.setItem(this.storageKey, JSON.stringify(stories));
            } catch (error) {
                console.error('Error updating story:', error);
            }
        }
    }

    static deleteStory(storyId: string): void {
        if (!isBrowser) return;
        
        const stories = this.getStories().filter(story => story.id !== storyId);
        try {
            localStorage.setItem(this.storageKey, JSON.stringify(stories));
        } catch (error) {
            console.error('Error deleting story:', error);
        }
    }

    static getStoriesByStatus(projectId: string, status: 'todo' | 'doing' | 'done'): Story[] {
        return this.getStoriesByProject(projectId).filter(story => story.status === status);
    }
} 