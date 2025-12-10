"use client";
import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";

const API_URL = "http://localhost:4000/api/users";

const AuthContext = createContext(null);

function AuthProvider({ children }) {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // fetch current user
  const fetchUser = useCallback(async (token) => {
    if (!token) return setUser(null);
    try {
      const res = await fetch(`${API_URL}/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        const data = await res.json();
        setUser(data);
      } else {
        const data = await res.json();
        // If authentication is required, clear token and user
        if (data.requiresLogin || res.status === 401) {
          localStorage.removeItem("token");
          setUser(null);
        } else {
          setUser(null);
        }
      }
    } catch (error) {
      console.error("Error fetching user:", error);
      // Clear token on network errors or other issues
      localStorage.removeItem("token");
      setUser(null);
    }
  }, []);

  // login
  const login = async (email, password) => {
    const res = await fetch(`${API_URL}/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (res.ok) {
      localStorage.setItem("token", data.token);
      // refresh user information from server
      await fetchUser(data.token);
    }
    return { status: res.status, ...data };
  };

  // signup 
  const signup = async (formData) => {
    try {
      // remove old token
      localStorage.removeItem("token");

      const res = await fetch(`${API_URL}/register`, {
        method: "POST",
        body: formData, // FormData directly, do NOT set Content-Type
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Signup failed");
      }

      localStorage.setItem("token", data.token);
      setUser(data.user);

      return data;
    } catch (err) {
      console.error(err);
      throw err;
    }
  };

  // logout
  const logout = () => {
    localStorage.removeItem("token");
    setUser(null);
    router.push("/auth/login");
  };

  const editProfile = async (formData) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return { success: false, message: "Not authenticated" };
  
      if (!token) {
        logout(); // Clear state and redirect to login
        throw new Error("Not authenticated");
      }

      const res = await fetch(`${API_URL}/edit`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });
  
      const data = await res.json();
  
      if (!res.ok) {
        // Instead of throwing, return backend message so UI stays on same page
        return { success: false, message: data.message || "Update failed" };
      }
  
      // Update state
      setUser(data.user);
      return { success: true, ...data };

      // Check if authentication is required
      if (data.requiresLogin || res.status === 401) {
        logout(); // Clear state and redirect to login
        throw new Error("Session expired. Please login again.");
      }

      if (!res.ok) {
        throw new Error(data.message || "Update failed");
      }

      setUser(data.user); 
      return data;
    } catch (err) {
      console.error(err);
      return { success: false, message: err.message || "Server error" };
    }
  };
  

  // check auth on mount
  useEffect(() => {
    const token = localStorage.getItem("token");
    fetchUser(token).finally(() => setLoading(false));
  }, [fetchUser]);

  return (
    <AuthContext.Provider value={{ user, loading, login, signup, logout, editProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

function useAuth() {
  return useContext(AuthContext);
}

export { useAuth, AuthProvider };
