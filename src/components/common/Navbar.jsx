import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

/**
 * Navbar component — renders differently for admin vs. student.
 * Includes user info, navigation links, and logout action.
 */
export function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <header className="navbar">
      <div className="navbar__inner">
        <Link to="/" className="navbar__brand">
          <span className="navbar__logo">◈</span>
          <span className="navbar__name">NeuralClass</span>
        </Link>

        <nav className="navbar__nav">
          {user?.isAdmin ? (
            <>
              <Link to="/admin" className="navbar__link">Dashboard</Link>
              <Link to="/admin/users" className="navbar__link">Users</Link>
              <Link to="/admin/usage" className="navbar__link">Usage</Link>
            </>
          ) : (
            <>
              <Link to="/dashboard" className="navbar__link">Dashboard</Link>
              <Link to="/dashboard/questions" className="navbar__link">Questions</Link>
              <Link to="/dashboard/ai" className="navbar__link">Ask AI</Link>
            </>
          )}
        </nav>

        <div className="navbar__user">
          <div className="navbar__user-info">
            <span className="navbar__user-name">{user?.name}</span>
            <span className={`navbar__user-role navbar__user-role--${user?.role}`}>
              {user?.isAdmin ? 'Administrator' : 'Student'}
            </span>
          </div>
          <button className="navbar__logout" onClick={handleLogout}>
            Sign Out
          </button>
        </div>
      </div>
    </header>
  );
}
