import { createContext, useContext, useState, useEffect } from "react";

const AuthContext = createContext(null);

// ============================================================
// MULTI-SESSION AUTH SYSTEM
// Allows users to be logged in as multiple roles simultaneously
// Each role has its own token storage and doesn't interfere with others
// ============================================================

// Get all active sessions from localStorage
function getAllSessions() {
  const sessions = {};
  
  const userToken = localStorage.getItem("userToken");
  if (userToken) {
    sessions.user = {
      token: userToken,
      id: localStorage.getItem("userId"),
      name: localStorage.getItem("userName"),
      email: localStorage.getItem("userEmail"),
      role: "user",
    };
  }
  
  const ownerToken = localStorage.getItem("ownerToken");
  if (ownerToken) {
    sessions.owner = {
      token: ownerToken,
      id: localStorage.getItem("ownerId"),
      name: localStorage.getItem("ownerName"),
      role: "owner",
    };
  }
  
  const adminToken = localStorage.getItem("adminToken");
  if (adminToken) {
    const adminData = JSON.parse(localStorage.getItem("adminData") || "{}");
    sessions.admin = {
      token: adminToken,
      id: adminData.id || adminData._id,
      name: adminData.name || adminData.fullName,
      role: localStorage.getItem("adminRole") || "admin",
      ...adminData,
    };
  }
  
  return sessions;
}

// Helper function to get initial auth state from localStorage (SYNCHRONOUS)
// This prevents redirect flash on page refresh
function getInitialAuthState() {
  try {
    const storedRole = localStorage.getItem("authRole");
    const sessions = getAllSessions();
    
    // If no stored role, check for any active session
    let activeRole = storedRole;
    if (!activeRole || !sessions[activeRole === "super_admin" ? "admin" : activeRole]) {
      // Pick the first available session
      if (sessions.admin) activeRole = sessions.admin.role;
      else if (sessions.owner) activeRole = "owner";
      else if (sessions.user) activeRole = "user";
      else return null;
    }

    // Get session data for the active role
    const sessionKey = activeRole === "super_admin" ? "admin" : activeRole;
    const session = sessions[sessionKey];
    
    if (!session) return null;

    // Return initial auth state from localStorage
    return {
      id: session.id,
      name: session.name,
      email: session.email || "",
      role: activeRole,
      permissions: {},
      sessions, // Include all active sessions
      _initialLoad: true,
    };
  } catch (e) {
    console.error("Error reading initial auth state:", e);
    return null;
  }
}

export function AuthProvider({ children }) {
  // CRITICAL: Initialize auth from localStorage IMMEDIATELY to prevent redirect flash
  const [auth, setAuth] = useState(getInitialAuthState);
  const [loading, setLoading] = useState(true);

  // Check auth on mount - this verifies the localStorage data with the server
  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      // Get the active role from localStorage
      const storedRole = localStorage.getItem("authRole");
      const sessions = getAllSessions();
      
      // Determine which token to use based on stored role
      let token = null;
      let expectedRole = storedRole;
      
      if (storedRole === "admin" || storedRole === "super_admin") {
        token = sessions.admin?.token;
      } else if (storedRole === "owner") {
        token = sessions.owner?.token;
      } else if (storedRole === "user") {
        token = sessions.user?.token;
      } else {
        // Fallback: use any available token with priority admin > owner > user
        if (sessions.admin) {
          token = sessions.admin.token;
          expectedRole = sessions.admin.role;
        } else if (sessions.owner) {
          token = sessions.owner.token;
          expectedRole = "owner";
        } else if (sessions.user) {
          token = sessions.user.token;
          expectedRole = "user";
        }
      }

      if (!token) {
        setAuth(null);
        setLoading(false);
        return;
      }

      // Verify token with server
      const res = await fetch(`http://localhost:5000/api/auth/me?expectedRole=${expectedRole || ""}`, {
        headers: { 
          Authorization: `Bearer ${token}`,
          "X-Expected-Role": expectedRole || "",
        },
        cache: "no-store",
      });

      if (res.ok) {
        const data = await res.json();
        const returnedRole = (data.role || "").toLowerCase();
        
        // IMPORTANT: Only update the token for THIS role, don't touch other sessions
        localStorage.setItem("authRole", returnedRole);
        
        if (returnedRole === "admin" || returnedRole === "super_admin") {
          localStorage.setItem("adminToken", token);
          localStorage.setItem("adminRole", data.role);
          localStorage.setItem("adminData", JSON.stringify(data));
        } else if (returnedRole === "owner") {
          localStorage.setItem("ownerToken", token);
          localStorage.setItem("ownerId", data.id);
          localStorage.setItem("ownerName", data.name);
        } else {
          localStorage.setItem("userToken", token);
          localStorage.setItem("userId", data.id);
          localStorage.setItem("userName", data.name);
          localStorage.setItem("userEmail", data.email);
        }

        // Get updated sessions after verification
        const updatedSessions = getAllSessions();

        setAuth({
          ...data,
          role: data.role,
          sessions: updatedSessions,
          _verified: true,
        });
      } else {
        // Only clear the CURRENT role's token, not all tokens
        console.warn("Auth check failed for role:", expectedRole);
        clearRoleSession(expectedRole);
        
        // Check if we have another session to fall back to
        const remainingSessions = getAllSessions();
        if (Object.keys(remainingSessions).length > 0) {
          // Switch to another available session
          const fallbackRole = Object.keys(remainingSessions)[0];
          localStorage.setItem("authRole", fallbackRole === "admin" ? remainingSessions.admin.role : fallbackRole);
          checkAuth(); // Re-run auth check with new role
          return;
        }
        
        setAuth(null);
      }
    } catch (err) {
      console.error("Auth check error:", err);
      setAuth(prev => {
        if (prev && prev._initialLoad) {
          console.warn("Network error during auth check, keeping initial auth state");
          return { ...prev, _networkError: true };
        }
        return null;
      });
    } finally {
      setLoading(false);
    }
  };

  // Clear only a specific role's session
  const clearRoleSession = (role) => {
    if (role === "admin" || role === "super_admin") {
      localStorage.removeItem("adminToken");
      localStorage.removeItem("adminRole");
      localStorage.removeItem("adminData");
    } else if (role === "owner") {
      localStorage.removeItem("ownerToken");
      localStorage.removeItem("ownerId");
      localStorage.removeItem("ownerName");
    } else if (role === "user") {
      localStorage.removeItem("userToken");
      localStorage.removeItem("userId");
      localStorage.removeItem("userName");
      localStorage.removeItem("userEmail");
    }
  };

  // Clear ALL auth sessions (full logout)
  const clearAuth = () => {
    localStorage.removeItem("userToken");
    localStorage.removeItem("ownerToken");
    localStorage.removeItem("adminToken");
    localStorage.removeItem("authRole");
    localStorage.removeItem("userId");
    localStorage.removeItem("ownerId");
    localStorage.removeItem("adminRole");
    localStorage.removeItem("adminData");
    localStorage.removeItem("userName");
    localStorage.removeItem("ownerName");
    localStorage.removeItem("userEmail");
    setAuth(null);
  };

  // Login - PRESERVES other sessions, only sets new session for this role
  const login = (token, userData) => {
    const role = (userData.role || "user").toLowerCase();
    
    // Set this as the ACTIVE role
    localStorage.setItem("authRole", role);

    // Store token for THIS role only (don't clear other tokens)
    if (role === "admin" || role === "super_admin") {
      localStorage.setItem("adminToken", token);
      localStorage.setItem("adminRole", userData.role);
      localStorage.setItem("adminData", JSON.stringify(userData));
    } else if (role === "owner") {
      localStorage.setItem("ownerToken", token);
      localStorage.setItem("ownerId", userData._id || userData.id);
      localStorage.setItem("ownerName", userData.fullName || userData.name);
    } else {
      localStorage.setItem("userToken", token);
      localStorage.setItem("userId", userData._id || userData.id);
      localStorage.setItem("userName", userData.name);
      localStorage.setItem("userEmail", userData.email);
    }

    // Get all sessions after login
    const sessions = getAllSessions();

    setAuth({
      id: userData._id || userData.id,
      name: userData.name || userData.fullName,
      email: userData.email,
      role: userData.role,
      permissions: {},
      sessions,
    });
  };

  // Logout from current role only (preserves other sessions)
  const logoutCurrentRole = () => {
    const currentRole = auth?.role?.toLowerCase();
    if (currentRole) {
      clearRoleSession(currentRole);
    }
    
    // Check for remaining sessions
    const remainingSessions = getAllSessions();
    const remainingRoles = Object.keys(remainingSessions);
    
    if (remainingRoles.length > 0) {
      // Switch to another session
      const newRole = remainingRoles[0] === "admin" ? remainingSessions.admin.role : remainingRoles[0];
      localStorage.setItem("authRole", newRole);
      
      const session = remainingSessions[remainingRoles[0]];
      setAuth({
        id: session.id,
        name: session.name,
        email: session.email || "",
        role: newRole,
        sessions: remainingSessions,
      });
    } else {
      localStorage.removeItem("authRole");
      setAuth(null);
    }
  };

  // Full logout (clears all sessions)
  const logout = () => {
    clearAuth();
  };

  // Switch active session to a different role
  const switchRole = (role) => {
    const sessions = getAllSessions();
    const sessionKey = role === "super_admin" ? "admin" : role;
    
    if (!sessions[sessionKey]) {
      console.warn(`No session found for role: ${role}`);
      return false;
    }
    
    const session = sessions[sessionKey];
    localStorage.setItem("authRole", role);
    
    setAuth({
      id: session.id,
      name: session.name,
      email: session.email || "",
      role: role,
      permissions: {},
      sessions,
    });
    
    return true;
  };

  // Check if user has a session for a specific role
  const hasSession = (role) => {
    const sessions = getAllSessions();
    const sessionKey = role === "super_admin" ? "admin" : role;
    return !!sessions[sessionKey];
  };

  // Get token for a specific role
  const getTokenForRole = (role) => {
    if (role === "admin" || role === "super_admin") {
      return localStorage.getItem("adminToken");
    } else if (role === "owner") {
      return localStorage.getItem("ownerToken");
    } else {
      return localStorage.getItem("userToken");
    }
  };

  return (
    <AuthContext.Provider value={{ 
      auth, 
      loading, 
      checkAuth, 
      clearAuth, 
      login, 
      logout,
      logoutCurrentRole,
      switchRole,
      hasSession,
      getTokenForRole,
      sessions: auth?.sessions || getAllSessions(),
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}

