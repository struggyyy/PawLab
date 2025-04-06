# ManagMe - Project Management Application

A modern project management application with authentication via Supabase.

## Authentication Features

- User registration and login with email/password
- JWT token-based authentication
- Protected routes that require authentication
- Automatic token refresh

## Getting Started

1. Clone the repository
2. Install dependencies:
   ```
   npm install
   ```
3. Set up environment variables:
   Create a `.env.local` file with the following:
   ```
   NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
   ```

4. Run the development server:
   ```
   npm run dev
   ```

## Authentication Flow

1. Users can register for an account or log in with existing credentials
2. After successful authentication, users are redirected to the main dashboard
3. All dashboard routes are protected and require authentication
4. JWT tokens are automatically refreshed by Supabase

## Project Structure

- `app/` - Main application code
  - `context/` - React context providers, including auth context
  - `lib/` - Utility functions and libraries
  - `login/` - Login page
  - `signup/` - Registration page
  - `(protected)/` - Routes that require authentication
  - `styles/` - Global styles

## Technologies Used

- Next.js
- React
- Supabase (Authentication)
- TypeScript
- CSS Modules

## License

This project is licensed under the MIT License.
