"use client";

import { useState, useRef, KeyboardEvent } from "react";

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
}

interface Props {
    credential: Credential | null;
    existingPassword: string;
    onSave: (data: {
        name: string;
        username: string;
        password: string;
        url: string;
        notes: string;
        tags: string[];
    }) => void;
    onClose: () => void;
}

export default function CredentialForm({
    credential,
    existingPassword,
    onSave,
    onClose,
}: Props) {
    const [name, setName] = useState(credential?.name || "");
    const [username, setUsername] = useState(credential?.username || "");
    const [password, setPassword] = useState(existingPassword || "");
    const [showPassword, setShowPassword] = useState(false);
    const [url, setUrl] = useState(credential?.url || "");
    const [notes, setNotes] = useState(credential?.notes || "");
    const [tags, setTags] = useState<string[]>(
        credential?.tags.map((t) => t.name) || []
    );
    const [tagInput, setTagInput] = useState("");
    const [saving, setSaving] = useState(false);
    const tagInputRef = useRef<HTMLInputElement>(null);

    const handleTagKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
        if ((e.key === "Enter" || e.key === ",") && tagInput.trim()) {
            e.preventDefault();
            const newTag = tagInput.trim().toLowerCase();
            if (!tags.includes(newTag)) {
                setTags([...tags, newTag]);
            }
            setTagInput("");
        } else if (e.key === "Backspace" && !tagInput && tags.length > 0) {
            setTags(tags.slice(0, -1));
        }
    };

    const removeTag = (tagToRemove: string) => {
        setTags(tags.filter((t) => t !== tagToRemove));
    };

    const generatePassword = () => {
        const charset =
            "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+-=[]{}|;:,.<>?";
        const array = new Uint8Array(24);
        crypto.getRandomValues(array);
        const generated = Array.from(array)
            .map((byte) => charset[byte % charset.length])
            .join("");
        setPassword(generated);
        setShowPassword(true);
    };

    const handleSubmit = async () => {
        if (!name || !username || !password) return;
        setSaving(true);
        await onSave({ name, username, password, url, notes, tags });
        setSaving(false);
    };

    const isValid = name.trim() && username.trim() && password.trim();

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <div className="modal-title">
                    <span className="accent">{credential ? "✎" : "+"}</span>{" "}
                    {credential ? "Edit Credential" : "New Credential"}
                </div>

                <div className="form-group">
                    <label className="form-label">
                        Name <span className="required">*</span>
                    </label>
                    <input
                        type="text"
                        className="form-input"
                        placeholder="e.g. GitHub, AWS Console, Netflix"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        autoFocus
                    />
                </div>

                <div className="form-group">
                    <label className="form-label">
                        Username / Email <span className="required">*</span>
                    </label>
                    <input
                        type="text"
                        className="form-input"
                        placeholder="your.email@example.com"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                    />
                </div>

                <div className="form-group">
                    <label className="form-label">
                        Password <span className="required">*</span>
                    </label>
                    <div className="form-input-wrapper">
                        <input
                            type={showPassword ? "text" : "password"}
                            className="form-input"
                            placeholder="Enter password or generate one"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            style={{ paddingRight: "5.5rem" }}
                        />
                        <button
                            type="button"
                            className="toggle-visibility"
                            onClick={() => setShowPassword(!showPassword)}
                            style={{ right: "2.2rem" }}
                        >
                            {showPassword ? "◉" : "◎"}
                        </button>
                        <button
                            type="button"
                            className="toggle-visibility"
                            onClick={generatePassword}
                            title="Generate password"
                        >
                            ⟳
                        </button>
                    </div>
                </div>

                <div className="form-group">
                    <label className="form-label">URL</label>
                    <input
                        type="text"
                        className="form-input"
                        placeholder="https://example.com"
                        value={url}
                        onChange={(e) => setUrl(e.target.value)}
                    />
                </div>

                <div className="form-group">
                    <label className="form-label">Tags</label>
                    <div
                        className="tags-input-container"
                        onClick={() => tagInputRef.current?.focus()}
                    >
                        {tags.map((tag) => (
                            <span key={tag} className="tag-badge">
                                #{tag}
                                <button onClick={() => removeTag(tag)}>×</button>
                            </span>
                        ))}
                        <input
                            ref={tagInputRef}
                            type="text"
                            className="tags-input"
                            placeholder={tags.length === 0 ? "Type and press Enter..." : ""}
                            value={tagInput}
                            onChange={(e) => setTagInput(e.target.value)}
                            onKeyDown={handleTagKeyDown}
                        />
                    </div>
                    <div className="tags-hint">
                        Press Enter or comma to add a tag. Backspace to remove.
                    </div>
                </div>

                <div className="form-group">
                    <label className="form-label">Notes</label>
                    <textarea
                        className="form-input form-textarea"
                        placeholder="Optional notes..."
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                    />
                </div>

                <div className="modal-actions">
                    <button className="btn-cancel" onClick={onClose}>
                        Cancel
                    </button>
                    <button
                        className="btn-save"
                        onClick={handleSubmit}
                        disabled={!isValid || saving}
                    >
                        {saving
                            ? "Encrypting..."
                            : credential
                                ? "Update Secret"
                                : "Save Secret"}
                    </button>
                </div>
            </div>
        </div>
    );
}
