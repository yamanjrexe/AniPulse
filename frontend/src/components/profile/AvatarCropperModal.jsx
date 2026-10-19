import React, { useEffect, useRef, useState } from "react";
import Cropper from "cropperjs";
import "cropperjs/dist/cropper.min.css";

export default function AvatarCropperModal({
  open,
  imageUrl,
  aspectRatio = 1,
  outputWidth = 200,
  outputHeight = 200,
  isCircular = false,
  title = "Crop Image",
  onCancel,
  onConfirm,
}) {
  const imgRef = useRef(null);
  const cropperRef = useRef(null);
  const [zoom, setZoom] = useState(0);

  useEffect(() => {
    if (!open || !imageUrl) return;
    const img = imgRef.current;
    if (!img) return;
    img.src = imageUrl;

    const init = () => {
      if (cropperRef.current) cropperRef.current.destroy();
      cropperRef.current = new Cropper(img, {
        aspectRatio,
        viewMode: 1, // YT/FB style restricts the image to the crop box
        dragMode: "move",
        autoCropArea: 1,
        restore: false,
        guides: false, // Hide default grid for a cleaner look
        center: false,
        highlight: false, // Remove the dark overlay
        cropBoxMovable: true,
        cropBoxResizable: true,
        toggleDragModeOnDblclick: false,
        zoomable: true,
        zoomOnTouch: true,
        zoomOnWheel: true,
        minCropBoxWidth: 50,
        minCropBoxHeight: 50,
        ready() {
          cropperRef.current.setDragMode("move");
          cropperRef.current.zoomTo(0);
        },
        zoom(event) {
          setZoom(event.detail.ratio);
        },
      });
    };

    if (img.complete) init();
    else img.onload = init;

    return () => {
      if (cropperRef.current) {
        cropperRef.current.destroy();
        cropperRef.current = null;
      }
    };
  }, [open, imageUrl, aspectRatio]);

  const handleZoom = (e) => {
    const val = parseFloat(e.target.value);
    setZoom(val);
    cropperRef.current?.zoomTo(val);
  };

  const handleConfirm = () => {
    if (!cropperRef.current) return;
    const canvas = cropperRef.current.getCroppedCanvas({
      width: outputWidth,
      height: outputHeight,
      imageSmoothingEnabled: true,
      imageSmoothingQuality: "high",
    });
    onConfirm?.(canvas.toDataURL("image/jpeg", 0.92));
  };

  if (!open) return null;

  return (
    <div
      className="modal show active"
      style={{
        display: "flex",
        position: "fixed",
        inset: 0,
        zIndex: 100000,
        alignItems: "center",
        justifyContent: "center",
        background: "rgba(0,0,0,0.85)",
      }}
    >
      <div
        className="modal-content"
        style={{
          maxWidth: 800,
          width: "92%",
          padding: 20,
          background: "var(--bg-card, #1A2234)",
          borderRadius: 16,
          boxShadow: "0 24px 60px -20px rgba(0,0,0,0.8)",
        }}
      >
        <div
          className="modal-header"
          style={{
            marginBottom: 16,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <h2
            className="modal-title"
            style={{ fontSize: "1.25rem", margin: 0 }}
          >
            {title}
          </h2>
          <button
            className="close-modal"
            onClick={onCancel}
            style={{
              background: "transparent",
              border: "none",
              color: "var(--text-muted)",
              fontSize: "1.5rem",
              cursor: "pointer",
            }}
          >
            &times;
          </button>
        </div>

        <div
          className={`crop-container ${isCircular ? "circular-crop" : ""}`}
          style={{
            height: "50vh",
            background: "#000",
            borderRadius: isCircular ? "16px" : "8px",
            overflow: "hidden",
          }}
        >
          <img
            ref={imgRef}
            alt="Crop preview"
            style={{ display: "block", maxWidth: "100%" }}
          />
        </div>

        {/* Zoom Slider (YT/FB Style) */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "16px",
            marginTop: "20px",
            padding: "0 20px",
          }}
        >
          <i
            className="fas fa-search-minus"
            style={{ color: "var(--text-muted)" }}
          />
          <input
            type="range"
            min="0"
            max="3"
            step="0.01"
            value={zoom}
            onChange={handleZoom}
            style={{
              flex: 1,
              cursor: "pointer",
              accentColor: "var(--brand-yellow)",
            }}
          />
          <i
            className="fas fa-search-plus"
            style={{ color: "var(--text-muted)" }}
          />
        </div>

        <div
          className="form-actions"
          style={{
            marginTop: 24,
            display: "flex",
            gap: 12,
            justifyContent: "flex-end",
          }}
        >
          <button
            type="button"
            className="btn btn-secondary"
            onClick={onCancel}
          >
            Cancel
          </button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={handleConfirm}
          >
            Save
          </button>
        </div>
      </div>

      {/* YT/FB style circular mask CSS for Avatar */}
      <style>{`
                .circular-crop .cropper-view-box,
                .circular-crop .cropper-face {
                    border-radius: 50%;
                }
                .cropper-view-box {
                    outline: 2px solid var(--brand-yellow, #FCE706);
                    outline-color: rgba(252, 231, 6, 0.75);
                }
            `}</style>
    </div>
  );
}
