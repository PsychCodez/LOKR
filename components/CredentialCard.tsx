"use client";

import { useState } from "react";

interface Tag {
    id: string;
    name: string;
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

interface Props {
    credential: Credential;
    onEdit: () => void;
    onDelete: () => void;
    onCopy: () => void;
    onTagClick: (tag: string) => void;
}

export default function CredentialCard({
    credential,
    onEdit,
    onDelete,
    onCopy,
    onTagClick,
}: Props) {
    const [revealed, setRevealed] = useState(false);
    const [password, setPassword] = useState("");
    const [loadingPw, setLoadingPw] = useState(false);
    const [copied, setCopied] = useState(false);

    const toggleReveal = async () => {
        if (revealed) {
            setRevealed(false);
            setPassword("");
            return;
        }

        setLoadingPw(true);
        try {
            const res = await fetch(`/api/credentials/${credential.id}/reveal`);
            if (res.ok) {
                const data = await res.json();
                setPassword(data.password);
                setRevealed(true);
            }
        } catch {
            // ignore
        } finally {
            setLoadingPw(false);
        }
    };

    const handleCopy = () => {
        onCopy();
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="credential-card">
            <div className="card-header">
                <div>
                    <div className="card-title">{credential.name}</div>
                    {credential.url && (
                        <a
                            href={
                                credential.url.startsWith("http")
                                    ? credential.url
                                    : `https://${credential.url}`
                            }
                            className="card-url"
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            {credential.url}
                        </a>
                    )}
                </div>
                <div className="card-actions">
                    <button className="icon-btn" onClick={onEdit} title="Edit">
                        ✎
                    </button>
                    <button
                        className="icon-btn danger"
                        onClick={onDelete}
                        title="Delete"
                    >
                        ✕
                    </button>
                </div>
            </div>

            <div className="card-field">
                <span className="card-field-label">Username</span>
                <span className="card-field-value">{credential.username}</span>
            </div>

            <div className="card-field">
                <span className="card-field-label">Password</span>
                <div className="password-field">
                    <span className={`password-display ${revealed ? "revealed" : ""}`}>
                        {loadingPw ? (
                            "decrypting..."
                        ) : revealed ? (
                            password
                        ) : (
                            <span className="password-dots">••••••••••••</span>
                        )}
                    </span>
                    <button
                        className="icon-btn"
                        onClick={toggleReveal}
                        title={revealed ? "Hide" : "Show"}
                    >
                        {revealed ? "◉" : "◎"}
                    </button>
                    <button
                        className={`copy-btn ${copied ? "copied" : ""}`}
                        onClick={handleCopy}
                        title="Copy password"
                    >
                        {copied ? "✓" : "⧉"}
                    </button>
                </div>
            </div>

            {credential.tags.length > 0 && (
                <div className="card-tags">
                    {credential.tags.map((tag) => (
                        <span
                            key={tag.id}
                            className="tag-chip"
                            onClick={() => onTagClick(tag.name)}
                        >
                            #{tag.name}
                        </span>
                    ))}
                </div>
            )}

            {credential.notes && (
                <div className="card-notes">{credential.notes}</div>
            )}
        </div>
    );
}
