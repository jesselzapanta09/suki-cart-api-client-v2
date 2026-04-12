import React, { useState, useEffect } from "react"
import { Outlet, Link, useNavigate, useLocation } from "react-router-dom"
import { App } from "antd"
import { useAuth } from "../context/AuthContext"
import Avatar from "../components/Avatar"

const IconShop = () => <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18"><path d="M6 2L3 6v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V6l-3-4zM6 4h12l2 2.67H4L6 4zm-.5 4h13v12h-13V8zm5 6v-2h3v2h-3z"/></svg>
const IconLogout = () => <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16"><path d="M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.58L17 17l5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z"/></svg>
const IconList = () => <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16"><path d="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z"/></svg>
const IconMenu = () => <svg viewBox="0 0 24 24" fill="currentColor" width="22" height="22"><path d="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z"/></svg>
const IconClose = () => <svg viewBox="0 0 24 24" fill="currentColor" width="22" height="22"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>
const IconKey = () => <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16"><path d="M12.65 10C11.83 7.67 9.61 6 7 6c-3.31 0-6 2.69-6 6s2.69 6 6 6c2.61 0 4.83-1.67 5.65-4H17v4h4v-4h2v-4H12.65zM7 14c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2z"/></svg>

const BREAKPOINT = 768

const NAV = [
    { label: "Browse Products", to: "/user/dashboard", icon: <IconList /> },
    { label: "Edit Profile", to: "/user/edit-profile", icon: <IconKey /> },
]

function useIsDesktop() {
    const [isDesktop, setIsDesktop] = useState(window.innerWidth >= BREAKPOINT)
    useEffect(() => {
        const handler = () => setIsDesktop(window.innerWidth >= BREAKPOINT)
        window.addEventListener("resize", handler)
        return () => window.removeEventListener("resize", handler)
    }, [])
    return isDesktop
}

export default function UserLayout() {
    const { user, logoutUser } = useAuth()
    const { message } = App.useApp()
    const navigate = useNavigate()
    const location = useLocation()
    const isDesktop = useIsDesktop()
    const [menuOpen, setMenuOpen] = useState(false)

    useEffect(() => { setMenuOpen(false) }, [location.pathname])
    useEffect(() => { if (isDesktop) setMenuOpen(false) }, [isDesktop])

    const handleLogout = async () => {
        await logoutUser()
        message.success("Logged out successfully")
        navigate("/login")
    }

    return (
        <div style={{ minHeight: "100vh", background: "#f6f7f9" }}>
            {/* Top navbar */}
            <nav style={{
                position: "sticky", top: 0, zIndex: 40,
                height: 62, background: "white",
                borderBottom: "1px solid #eceef2",
                boxShadow: "0 1px 4px rgba(0,0,0,0.05)",
                display: "flex", alignItems: "center", justifyContent: "space-between",
                padding: "0 1.25rem",
            }}>
                <Link to="/" style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{
                        width: 34, height: 34, borderRadius: 9,
                        background: "linear-gradient(135deg,#15803d,#22c55e)",
                        display: "flex", alignItems: "center", justifyContent: "center", color: "white",
                    }}>
                        <IconShop />
                    </div>
                    <span style={{ fontFamily: "Sora,sans-serif", fontWeight: 700, fontSize: "1rem", color: "#052e16" }}>
                        SukiCart
                    </span>
                </Link>

                {/* DESKTOP */}
                {isDesktop && (
                    <>
                        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                            {NAV.map(n => {
                                const active = location.pathname === n.to
                                return (
                                    <Link key={n.to} to={n.to} style={{
                                        display: "flex", alignItems: "center", gap: 7,
                                        padding: "8px 14px", borderRadius: 9, textDecoration: "none",
                                        color: active ? "#15803d" : "#677890",
                                        background: active ? "#dcfce7" : "transparent",
                                        fontFamily: "DM Sans,sans-serif", fontWeight: active ? 600 : 500,
                                        fontSize: "0.875rem", transition: "all 0.15s",
                                    }}
                                        onMouseEnter={e => { if (!active) e.currentTarget.style.background = "#f0fdf4" }}
                                        onMouseLeave={e => { if (!active) e.currentTarget.style.background = "transparent" }}>
                                        {n.icon} {n.label}
                                    </Link>
                                )
                            })}
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 12px", borderRadius: 100, background: "#f0fdf4", border: "1px solid #dcfce7" }}>
                                <Avatar user={user} />
                                <div>
                                    <div style={{ fontFamily: "DM Sans,sans-serif", fontWeight: 600, fontSize: "0.825rem", color: "#052e16" }}>{user?.username}</div>
                                    <div style={{ fontSize: "0.62rem", color: "#22c55e", fontFamily: "JetBrains Mono,monospace" }}>USER</div>
                                </div>
                            </div>
                            <button onClick={handleLogout} style={{
                                display: "flex", alignItems: "center", gap: 6,
                                padding: "8px 14px", borderRadius: 9,
                                border: "1px solid #eceef2", background: "white",
                                color: "#677890", fontFamily: "DM Sans,sans-serif",
                                fontWeight: 500, fontSize: "0.875rem", cursor: "pointer", transition: "all 0.15s",
                            }}
                                onMouseEnter={e => { e.currentTarget.style.borderColor = "#fca5a5"; e.currentTarget.style.color = "#ef4444"; e.currentTarget.style.background = "#fef2f2" }}
                                onMouseLeave={e => { e.currentTarget.style.borderColor = "#eceef2"; e.currentTarget.style.color = "#677890"; e.currentTarget.style.background = "white" }}>
                                <IconLogout /> Logout
                            </button>
                        </div>
                    </>
                )}

                {/* MOBILE */}
                {!isDesktop && (
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <Avatar user={user} />
                        <button onClick={() => setMenuOpen(v => !v)} style={{
                            background: "transparent", border: "1px solid #eceef2",
                            borderRadius: 8, padding: "5px 7px",
                            color: "#677890", cursor: "pointer",
                            display: "flex", alignItems: "center",
                        }}>
                            {menuOpen ? <IconClose /> : <IconMenu />}
                        </button>
                    </div>
                )}
            </nav>

            {/* MOBILE: dropdown menu */}
            {!isDesktop && menuOpen && (
                <>
                    <div onClick={() => setMenuOpen(false)} style={{ position: "fixed", inset: 0, zIndex: 30, background: "rgba(0,0,0,0.25)" }} />
                    <div style={{
                        position: "fixed", top: 62, left: 0, right: 0,
                        zIndex: 35, background: "white",
                        borderBottom: "1px solid #eceef2",
                        boxShadow: "0 8px 24px rgba(0,0,0,0.10)",
                        padding: "0.75rem 1rem",
                    }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", borderRadius: 10, background: "#f0fdf4", border: "1px solid #dcfce7", marginBottom: "0.75rem" }}>
                            <Avatar user={user} />
                            <div>
                                <div style={{ fontFamily: "DM Sans,sans-serif", fontWeight: 600, fontSize: "0.9rem", color: "#052e16" }}>{user?.username}</div>
                                <div style={{ fontSize: "0.65rem", color: "#22c55e", fontFamily: "JetBrains Mono,monospace" }}>USER</div>
                            </div>
                        </div>
                        {NAV.map(n => {
                            const active = location.pathname === n.to
                            return (
                                <Link key={n.to} to={n.to} style={{
                                    display: "flex", alignItems: "center", gap: 10,
                                    padding: "11px 12px", borderRadius: 9, textDecoration: "none",
                                    color: active ? "#15803d" : "#444f62",
                                    background: active ? "#dcfce7" : "transparent",
                                    fontFamily: "DM Sans,sans-serif", fontWeight: active ? 600 : 500,
                                    fontSize: "0.9rem", marginBottom: 4,
                                }}>
                                    {n.icon} {n.label}
                                </Link>
                            )
                        })}
                        <div style={{ borderTop: "1px solid #eceef2", margin: "0.5rem 0" }} />
                        <button onClick={handleLogout} style={{
                            width: "100%", display: "flex", alignItems: "center", gap: 10,
                            padding: "11px 12px", borderRadius: 9, border: "none",
                            background: "transparent", color: "#ef4444",
                            fontFamily: "DM Sans,sans-serif", fontWeight: 500, fontSize: "0.9rem",
                            cursor: "pointer", transition: "background 0.15s",
                        }}
                            onMouseEnter={e => e.currentTarget.style.background = "#fef2f2"}
                            onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                            <IconLogout /> Logout
                        </button>
                    </div>
                </>
            )}

            <Outlet />
        </div>
    )
}
