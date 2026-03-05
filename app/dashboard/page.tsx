"use client";

import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState, useEffect, useCallback } from "react";
import CredentialCard from "@/components/CredentialCard";
import CredentialForm from "@/components/CredentialForm";
import DeleteConfirm from "@/components/DeleteConfirm";
import Toast from "@/components/Toast";

interface Tag {
    id: string;
    name: string;
    count?: number;
}

interface Credential {
    id: string;
    name: string;
    username: string;
    url: string | null;
    notes: string | null;
    tags: Tag[];
    createdAt: string;
    updatedAt: string;
}

interface ToastMessage {
    id: number;
    text: string;
    type: "success" | "error";
}

export default function Dashboard() {
    const { data: session, status } = useSession();
    const router = useRouter();

    const [credentials, setCredentials] = useState<Credential[]>([]);
    const [tags, setTags] = useState<Tag[]>([]);
    const [search, setSearch] = useState("");
    const [activeTag, setActiveTag] = useState("");
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editCredential, setEditCredential] = useState<Credential | null>(null);
    const [editPassword, setEditPassword] = useState("");
    const [deleteTarget, setDeleteTarget] = useState<Credential | null>(null);
    const [toasts, setToasts] = useState<ToastMessage[]>([]);

    const addToast = useCallback((text: string, type: "success" | "error") => {
        const id = Date.now();
        setToasts((prev) => [...prev, { id, text, type }]);
        setTimeout(() => {
            setToasts((prev) => prev.filter((t) => t.id !== id));
        }, 3000);
    }, []);

    const fetchCredentials = useCallback(async () => {
        try {
            const params = new URLSearchParams();
            if (search) params.set("search", search);
            if (activeTag) params.set("tag", activeTag);
            const res = await fetch(`/api/credentials?${params.toString()}`);
            if (res.ok) {
                const data = await res.json();
                setCredentials(data);
            }
        } catch (err) {
            console.error("Failed to fetch credentials:", err);
        }
    }, [search, activeTag]);

    const fetchTags = useCallback(async () => {
        try {
            const res = await fetch("/api/tags");
            if (res.ok) {
                const data = await res.json();
                setTags(data);
            }
        } catch (err) {
            console.error("Failed to fetch tags:", err);
        }
    }, []);

    useEffect(() => {
        if (status === "unauthenticated") {
            router.push("/");
        }
    }, [status, router]);

    useEffect(() => {
        if (status === "authenticated") {
            setLoading(true);
            Promise.all([fetchCredentials(), fetchTags()]).finally(() =>
                setLoading(false)
            );
        }
    }, [status, fetchCredentials, fetchTags]);

    // Debounced search
    useEffect(() => {
        if (status !== "authenticated") return;
        const timer = setTimeout(() => {
            fetchCredentials();
        }, 300);
        return () => clearTimeout(timer);
    }, [search, activeTag, status, fetchCredentials]);

    const handleSave = async (data: {
        name: string;
        username: string;
        password: string;
        url: string;
        notes: string;
        tags: string[];
    }) => {
        try {
            if (editCredential) {
                const res = await fetch(`/api/credentials/${editCredential.id}`, {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(data),
                });
                if (res.ok) {
                    addToast("Credential updated successfully", "success");
                } else {
                    addToast("Failed to update credential", "error");
                }
            } else {
                const res = await fetch("/api/credentials", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(data),
                });
                if (res.ok) {
                    addToast("Credential saved securely", "success");
                } else {
                    addToast("Failed to save credential", "error");
                }
            }
            setShowForm(false);
            setEditCredential(null);
            setEditPassword("");
            fetchCredentials();
            fetchTags();
        } catch {
            addToast("Network error", "error");
        }
    };

    const handleEdit = async (cred: Credential) => {
        try {
            const res = await fetch(`/api/credentials/${cred.id}/reveal`);
            if (res.ok) {
                const data = await res.json();
                setEditPassword(data.password);
            } else {
                setEditPassword("");
            }
        } catch {
            setEditPassword("");
        }
        setEditCredential(cred);
        setShowForm(true);
    };

    const handleDelete = async (id: string) => {
        try {
            const res = await fetch(`/api/credentials/${id}`, {
                method: "DELETE",
            });
            if (res.ok) {
                addToast("Credential deleted", "success");
                fetchCredentials();
                fetchTags();
            } else {
                addToast("Failed to delete credential", "error");
            }
        } catch {
            addToast("Network error", "error");
        }
        setDeleteTarget(null);
    };

    const handleCopy = async (id: string) => {
        try {
            const res = await fetch(`/api/credentials/${id}/reveal`);
            if (res.ok) {
                const data = await res.json();
                await navigator.clipboard.writeText(data.password);
                addToast("Password copied to clipboard", "success");
            } else {
                addToast("Failed to copy password", "error");
            }
        } catch {
            addToast("Failed to copy password", "error");
        }
    };

    if (status === "loading" || loading) {
        return (
            <div className="app-container">
                <div className="loading-spinner" style={{ flex: 1 }}>
                    <div className="spinner" />
                </div>
            </div>
        );
    }

    if (status !== "authenticated") return null;

    return (
        <div className="app-container">
            {/* Top Bar */}
            <header className="top-bar">
                <div className="top-bar-brand">
                    <img src="/lokr-logo.png" alt="LOKR" className="lock-icon-img-sm" />
                    LOKR
                </div>
                <div className="top-bar-right">
                    <div className="user-info">
                        {session?.user?.image && (
                            <img
                                src={session.user.image}
                                alt=""
                                className="user-avatar"
                                referrerPolicy="no-referrer"
                            />
                        )}
                        <span>{session?.user?.email}</span>
                    </div>
                    <button className="signout-btn" onClick={() => signOut()}>
                        sign out
                    </button>
                </div>
            </header>

            <div className="main-content">
                {/* Sidebar — Tags */}
                <aside className="sidebar">
                    <div className="sidebar-header">Tags</div>
                    <div
                        className={`tag-item tag-all ${activeTag === "" ? "active" : ""}`}
                        onClick={() => setActiveTag("")}
                    >
                        <span>⊛ all credentials</span>
                        <span className="tag-count">{credentials.length}</span>
                    </div>
                    {tags.map((tag) => (
                        <div
                            key={tag.id}
                            className={`tag-item ${activeTag === tag.name ? "active" : ""}`}
                            onClick={() =>
                                setActiveTag(activeTag === tag.name ? "" : tag.name)
                            }
                        >
                            <span># {tag.name}</span>
                            <span className="tag-count">{tag.count}</span>
                        </div>
                    ))}
                </aside>

                {/* Content */}
                <main className="content-area">
                    <div className="toolbar">
                        <div className="search-input-wrapper">
                            <span className="search-icon">⌕</span>
                            <input
                                type="text"
                                className="search-input"
                                placeholder="Search by name, username, or URL..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                        </div>
                        <button
                            className="add-btn"
                            onClick={() => {
                                setEditCredential(null);
                                setEditPassword("");
                                setShowForm(true);
                            }}
                        >
                            + Add Secret
                        </button>
                    </div>

                    <div className="stats-bar">
                        <span>{credentials.length}</span> credentials stored
                        {activeTag && (
                            <>
                                {" "}
                                · filtered by <span>#{activeTag}</span>
                            </>
                        )}
                        {search && (
                            <>
                                {" "}
                                · searching &quot;<span>{search}</span>&quot;
                            </>
                        )}
                    </div>

                    {credentials.length === 0 ? (
                        <div className="empty-state">
                            <div className="empty-state-icon">🔑</div>
                            <div className="empty-state-title">
                                {search || activeTag ? "No matches found" : "No secrets yet"}
                            </div>
                            <p className="empty-state-text">
                                {search || activeTag
                                    ? "Try adjusting your search or tag filter."
                                    : "Click \"+ Add Secret\" to store your first encrypted credential."}
                            </p>
                        </div>
                    ) : (
                        <div className="credential-grid">
                            {credentials.map((cred) => (
                                <CredentialCard
                                    key={cred.id}
                                    credential={cred}
                                    onEdit={() => handleEdit(cred)}
                                    onDelete={() => setDeleteTarget(cred)}
                                    onCopy={() => handleCopy(cred.id)}
                                    onTagClick={(tag) =>
                                        setActiveTag(activeTag === tag ? "" : tag)
                                    }
                                />
                            ))}
                        </div>
                    )}
                </main>
            </div>

            {/* Form Modal */}
            {showForm && (
                <CredentialForm
                    credential={editCredential}
                    existingPassword={editPassword}
                    onSave={handleSave}
                    onClose={() => {
                        setShowForm(false);
                        setEditCredential(null);
                        setEditPassword("");
                    }}
                />
            )}

            {/* Delete Confirmation */}
            {deleteTarget && (
                <DeleteConfirm
                    name={deleteTarget.name}
                    onConfirm={() => handleDelete(deleteTarget.id)}
                    onCancel={() => setDeleteTarget(null)}
                />
            )}

            {/* Toasts */}
            <Toast messages={toasts} />
        </div>
    );
}
