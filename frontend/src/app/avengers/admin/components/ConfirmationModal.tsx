"use client";

import React from "react";
import { AlertTriangleIcon, CloseIcon } from "./CyberIcons";

interface ConfirmationModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  type?: "danger" | "warning" | "info";
  onConfirm: () => void;
  onClose: () => void;
}

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  title,
  message,
  confirmLabel = "CONFIRM",
  cancelLabel = "CANCEL",
  type = "warning",
  onConfirm,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div className="admin-modal-backdrop" onClick={onClose}>
      <div
        className="admin-modal-card cyber-corners"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <div className="admin-modal-header">
          <div className="modal-title-wrap">
            <AlertTriangleIcon
              className={`w-5 h-5 ${
                type === "danger"
                  ? "text-red"
                  : type === "warning"
                  ? "text-yellow"
                  : "text-cyan"
              }`}
            />
            <h3 className="modal-title">{title}</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="modal-close-btn"
            aria-label="Close modal"
          >
            <CloseIcon className="w-4 h-4 text-white" />
          </button>
        </div>

        <div className="admin-modal-body">
          <p className="modal-message">{message}</p>
        </div>

        <div className="admin-modal-footer">
          <button
            type="button"
            onClick={onClose}
            className="modal-btn modal-btn-cancel"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`modal-btn ${
              type === "danger" ? "modal-btn-danger" : "modal-btn-confirm"
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};
