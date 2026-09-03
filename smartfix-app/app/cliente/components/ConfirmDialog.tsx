"use client";

import styles from "./confirm-dialog.module.css";

type ConfirmDialogProps = {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  busy?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
};

export default function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = "Confirmar",
  busy = false,
  onCancel,
  onConfirm,
}: ConfirmDialogProps) {
  if (!open) return null;

  return (
    <div className={styles.modal} role="dialog" aria-modal="true" aria-labelledby="confirm-title">
      <button className={styles.overlay} type="button" aria-label="Cancelar" onClick={onCancel} disabled={busy} />
      <section className={styles.dialog}>
        <div className={styles.icon} aria-hidden="true">!</div>
        <div>
          <small>CONFIRMAÇÃO</small>
          <h2 id="confirm-title">{title}</h2>
          <p>{message}</p>
        </div>
        <div className={styles.actions}>
          <button type="button" onClick={onCancel} disabled={busy}>Cancelar</button>
          <button type="button" className={styles.confirm} onClick={onConfirm} disabled={busy}>
            {busy ? "Excluindo..." : confirmLabel}
          </button>
        </div>
      </section>
    </div>
  );
}
