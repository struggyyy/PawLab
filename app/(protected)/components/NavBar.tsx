"use client";

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import ThemeToggle from './ThemeToggle';

const NavBar: React.FC = () => {
  const { user, signOut } = useAuth();
  const router = useRouter();

  const handleSignOut = async () => {
    await signOut();
    router.push('/login');
  };

  return (
    <header className="app-header">
      <div className="header-content">
        <div className="logo-container">
          <Link href="/" className="logo">
            ManagMe
          </Link>
        </div>
        
        <div className="user-menu">
          {user?.email && <span className="user-email">{user.email}</span>}
          <ThemeToggle />
          <button onClick={handleSignOut} className="button-secondary sign-out-button">
            Sign Out
          </button>
        </div>
      </div>
    </header>
  );
};

export default NavBar; 