"use client";

interface Props {
    name: string;
    onConfirm: () => void;
    onCancel: () => void;
}

export default function DeleteConfirm({ name, onConfirm, onCancel }: Props) {
    return (
        <div className="modal-overlay" onClick={onCancel}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <div className="delete-confirm">
                    <div className="delete-confirm-icon">⚠</div>
                    <div className="delete-confirm-text">
                        Are you sure you want to permanently delete{" "}
                        <span className="delete-confirm-name">&quot;{name}&quot;</span>?
                        <br />
                        This action cannot be undone.
                    </div>
                    <div className="modal-actions" style={{ width: "100%", justifyContent: "center" }}>
                        <button className="btn-cancel" onClick={onCancel}>
                            Cancel
                        </button>
                        <button className="btn-delete" onClick={onConfirm}>
                            Delete Forever
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
