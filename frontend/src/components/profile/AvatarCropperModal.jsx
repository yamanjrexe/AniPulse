import React, { useEffect, useRef } from "react";
import Cropper from "cropperjs";
import "cropperjs/dist/cropper.min.css";

export default function AvatarCropperModal({
    open,
    imageUrl,
    aspectRatio = 1,
    outputWidth = 200,
    outputHeight = 200,
    onCancel,
    onConfirm,
}) {
    const imgRef = useRef(null);
    const cropperRef = useRef(null);

    useEffect(() => {
        if (!open || !imageUrl) return;
        const img = imgRef.current;
        if (!img) return;
        img.src = imageUrl;

        const init = () => {
            if (cropperRef.current) cropperRef.current.destroy();
            cropperRef.current = new Cropper(img, {
                aspectRatio,
                viewMode: 2,
                dragMode: "move",
                autoCropArea: 1,
                restore: false,
                guides: true,
                center: true,
                highlight: true,
                cropBoxMovable: true,
                cropBoxResizable: true,
                zoomable: true,
                zoomOnTouch: true,
                zoomOnWheel: true,
                minCropBoxWidth: 50,
                minCropBoxHeight: 50,
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
                background: "rgba(0,0,0,0.7)",
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
                }}
            >
                <div className="modal-header" style={{ marginBottom: 12 }}>
                    <h2 className="modal-title">Crop Image</h2>
                    <button className="close-modal" onClick={onCancel}>
                        &times;
                    </button>
                </div>
                <div
                    className="crop-container"
                    style={{ maxHeight: "60vh", overflow: "hidden" }}
                >
                    <img
                        ref={imgRef}
                        alt="Crop preview"
                        style={{ maxWidth: "100%", display: "block" }}
                    />
                </div>
                <div
                    className="form-actions"
                    style={{
                        marginTop: 16,
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
                        Crop &amp; Save
                    </button>
                </div>
            </div>
        </div>
    );
}
