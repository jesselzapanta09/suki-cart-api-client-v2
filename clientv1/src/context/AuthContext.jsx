import React, { createContext, useContext, useState, useEffect } from "react";
import { getProfile } from "../services/profileService";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let cancelled = false;

        const restoreAuth = async () => {
            const storedToken = localStorage.getItem("token");
            const storedUser = localStorage.getItem("user");
            let parsedUser = null;

            if (storedUser) {
                try {
                    parsedUser = JSON.parse(storedUser);
                } catch {
                    localStorage.removeItem("user");
                }
            }

            if (!storedToken) {
                setLoading(false);
                return;
            }

            setToken(storedToken);

            if (parsedUser) {
                setUser(parsedUser);
            }

            try {
                const data = await getProfile();
                if (cancelled) return;

                setUser(data.user);
                localStorage.setItem("user", JSON.stringify(data.user));
            } catch (err) {
                if (cancelled) return;

                if (err?.status === 401) {
                    setUser(null);
                    setToken(null);
                    localStorage.removeItem("token");
                    localStorage.removeItem("user");
                } else if (parsedUser) {
                    setUser(parsedUser);
                } else {
                    setUser(null);
                }
            } finally {
                if (!cancelled) {
                    setLoading(false);
                }
            }
        };

        restoreAuth();

        return () => {
            cancelled = true;
        };
    }, []);

    const loginUser = (userData, userToken) => {
        setUser(userData);
        setToken(userToken);
        localStorage.setItem("token", userToken);
        localStorage.setItem("user", JSON.stringify(userData));
    };

    const updateUser = (updatedData) => {
        const merged = { ...user, ...updatedData };
        setUser(merged);
        localStorage.setItem("user", JSON.stringify(merged));
    };

    const logoutUser = async () => {
        setUser(null);
        setToken(null);
        localStorage.removeItem("token");
        localStorage.removeItem("user");
    };

    return (
        <AuthContext.Provider value={{
            user, token, loading,
            loginUser, logoutUser, updateUser,
            isAuthenticated: !!token,
            isAdmin: user?.role === "admin",
            isSeller: user?.role === "seller",
            isCustomer: user?.role === "customer",
            role: user?.role ?? null,
        }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
