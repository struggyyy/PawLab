import { User } from '../models/User';

class UserService {
    private users: User[] = [
        { id: '1', firstName: 'Jan', lastName: 'Kowalski' },
        { id: '2', firstName: 'Anna', lastName: 'Nowak' },
        { id: '3', firstName: 'Piotr', lastName: 'Zalewski' },
    ];
    private currentUser: User;

    constructor() {
        this.currentUser = this.users[0];
    }

    getUser(): User {
        return this.currentUser;
    }

    setUser(userId: string): void {
        const user = this.users.find(u => u.id === userId);
        if (user) {
            this.currentUser = user;
        }
    }

    getUsers(): User[] {
        return this.users;
    }
}

const userService = new UserService();

export default userService;