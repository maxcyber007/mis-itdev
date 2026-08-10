"use client";

/** โมดัลอย่างง่ายที่ควบคุมด้วย React (ไม่ต้องพึ่ง JavaScript ของ Bootstrap) */
export default function Modal({ title, open, onClose, children, footer, size }) {
  if (!open) return null;

  return (
    <>
      <div
        className="modal d-block"
        role="dialog"
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose();
        }}
      >
        <div className={`modal-dialog ${size ? `modal-${size}` : ""} modal-dialog-centered`}>
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">{title}</h5>
              <button
                type="button"
                className="btn-close"
                aria-label="ปิด"
                onClick={onClose}
              />
            </div>
            <div className="modal-body">{children}</div>
            {footer ? <div className="modal-footer">{footer}</div> : null}
          </div>
        </div>
      </div>
      <div className="modal-backdrop show" />
    </>
  );
}
