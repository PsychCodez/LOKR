"use client";

interface ToastMessage {
    id: number;
    text: string;
    type: "success" | "error";
}

interface Props {
    messages: ToastMessage[];
}

export default function Toast({ messages }: Props) {
    if (messages.length === 0) return null;

    return (
        <div className="toast-container">
            {messages.map((msg) => (
                <div key={msg.id} className={`toast ${msg.type}`}>
                    <span>{msg.type === "success" ? "✓" : "✕"}</span>
                    {msg.text}
                </div>
            ))}
        </div>
    );
}
