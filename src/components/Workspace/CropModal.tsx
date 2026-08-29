// ============================================================================
// File : src/components/Workspace/CropModal.tsx
//
// Original Image Crop (v1.4.0): lets the user select a sub-region of the
// current Workspace's uploaded ORIGINAL image (workspace.uploadedImagePath)
// and confirm it as this Workspace's Crop. The original image itself is
// never modified here - Apply only ever produces a brand-new, separate
// cropped bitmap (via an offscreen <canvas>, drawn at the selection's real
// pixel size, never a scaled-down screen capture) that generate.ts uses
// instead of the original when present (see generate.ts's
// `croppedImagePath ?? uploadedImagePath`). Cancel/Reset never touch the
// original either - Reset only widens the in-progress selection back to
// the full image, it does not itself confirm anything until Apply is
// clicked.
//
// All crop math (the selection rectangle, drag/resize) is done in the
// original image's own natural pixel coordinates throughout - the on-
// screen selection box you see is only that rectangle scaled to whatever
// size the <img> happens to be displayed at, purely for drawing. This is
// what keeps the actual Crop result at full original resolution
// regardless of how small/large the modal renders the preview.
// ============================================================================

import { useCallback, useEffect, useRef, useState } from "react";

import "./CropModal.css";

import { CropRect } from "../../types/Workspace";

interface CropModalProps {

    imageDataUrl: string;

    initialCropRect?: CropRect;

    onApply: (croppedDataUrl: string, cropRect: CropRect) => void;

    onCancel: () => void;

}

type DragMode = "move" | "nw" | "ne" | "sw" | "se" | "draw";

interface DragState {

    mode: DragMode;

    startClientX: number;

    startClientY: number;

    startRect: CropRect;

}

const MIN_SIZE = 20;

function clamp(value: number, min: number, max: number): number {

    return Math.min(Math.max(value, min), max);

}

export default function CropModal({

    imageDataUrl,

    initialCropRect,

    onApply,

    onCancel,

}: CropModalProps) {

    const imgRef = useRef<HTMLImageElement>(null);

    const dragRef = useRef<DragState | null>(null);

    // Mirrors naturalSize (state, below) for the stable drag callbacks -
    // refs read live values without needing to be recreated every time
    // naturalSize changes, which is what lets onDragMove/onDragEnd keep
    // one identity for their whole mounted lifetime (see the matching
    // addEventListener/removeEventListener calls throughout this file).
    const naturalSizeRef = useRef<{ width: number; height: number } | null>(null);

    const [naturalSize, setNaturalSize] = useState<{ width: number; height: number } | null>(null);

    const [displaySize, setDisplaySize] = useState<{ width: number; height: number } | null>(null);

    const [rect, setRect] = useState<CropRect | null>(null);

    // ESC cancels, same keyboard-close pattern as PromptModal.tsx.
    useEffect(() => {

        const onKeyDown = (e: KeyboardEvent) => {

            if (e.key === "Escape")
                onCancel();

        };

        document.addEventListener("keydown", onKeyDown);

        return () => document.removeEventListener("keydown", onKeyDown);

    }, [onCancel]);

    const syncDisplaySize = useCallback(() => {

        const img = imgRef.current;

        if (!img)
            return;

        setDisplaySize({ width: img.clientWidth, height: img.clientHeight });

    }, []);

    useEffect(() => {

        window.addEventListener("resize", syncDisplaySize);

        return () => window.removeEventListener("resize", syncDisplaySize);

    }, [syncDisplaySize]);

    const onImageLoad = () => {

        const img = imgRef.current;

        if (!img)
            return;

        const width = img.naturalWidth;
        const height = img.naturalHeight;

        naturalSizeRef.current = { width, height };
        setNaturalSize({ width, height });

        syncDisplaySize();

        // Re-editing an existing Crop starts from its last confirmed
        // selection; anything else (first-ever crop, or a stale rect that
        // no longer fits this image) starts from the full image.
        const fitsThisImage =
            !!initialCropRect &&
            initialCropRect.width > 0 &&
            initialCropRect.height > 0 &&
            initialCropRect.x + initialCropRect.width <= width + 1 &&
            initialCropRect.y + initialCropRect.height <= height + 1;

        setRect(fitsThisImage ? initialCropRect! : { x: 0, y: 0, width, height });

    };

    // Maps a mouse event's viewport coordinates to the original image's
    // own natural pixel coordinates - the one place display-pixel space
    // and real-image-pixel space meet. Only reads refs, never React
    // state, so it can stay a single stable identity for the whole
    // modal's lifetime (see the useCallback deps below).
    const toNaturalPoint = useCallback((clientX: number, clientY: number) => {

        const img = imgRef.current;
        const natural = naturalSizeRef.current;

        if (!img || !natural)
            return { x: 0, y: 0 };

        const box = img.getBoundingClientRect();

        const scaleX = natural.width / box.width;
        const scaleY = natural.height / box.height;

        return {
            x: clamp((clientX - box.left) * scaleX, 0, natural.width),
            y: clamp((clientY - box.top) * scaleY, 0, natural.height),
        };

    }, []);

    const onDragMove = useCallback((e: MouseEvent) => {

        const drag = dragRef.current;
        const natural = naturalSizeRef.current;

        if (!drag || !natural)
            return;

        const point = toNaturalPoint(e.clientX, e.clientY);
        const { startRect, mode } = drag;

        let next: CropRect = startRect;

        if (mode === "draw") {

            const x0 = startRect.x;
            const y0 = startRect.y;

            next = {
                x: Math.min(x0, point.x),
                y: Math.min(y0, point.y),
                width: Math.abs(point.x - x0),
                height: Math.abs(point.y - y0),
            };

        }
        else if (mode === "move") {

            const startPoint = toNaturalPoint(drag.startClientX, drag.startClientY);

            const dx = point.x - startPoint.x;
            const dy = point.y - startPoint.y;

            next = {
                x: clamp(startRect.x + dx, 0, natural.width - startRect.width),
                y: clamp(startRect.y + dy, 0, natural.height - startRect.height),
                width: startRect.width,
                height: startRect.height,
            };

        }
        else {

            // Corner resize - the opposite corner stays anchored.
            let x1 = startRect.x;
            let y1 = startRect.y;
            let x2 = startRect.x + startRect.width;
            let y2 = startRect.y + startRect.height;

            if (mode === "nw") { x1 = point.x; y1 = point.y; }
            else if (mode === "ne") { x2 = point.x; y1 = point.y; }
            else if (mode === "sw") { x1 = point.x; y2 = point.y; }
            else if (mode === "se") { x2 = point.x; y2 = point.y; }

            next = {
                x: Math.min(x1, x2),
                y: Math.min(y1, y2),
                width: Math.abs(x2 - x1),
                height: Math.abs(y2 - y1),
            };

        }

        setRect(next);

    }, [toNaturalPoint]);

    const onDragEnd = useCallback(() => {

        dragRef.current = null;

        window.removeEventListener("mousemove", onDragMove);
        window.removeEventListener("mouseup", onDragEnd);

        // A drag can end with a near-zero-size box (a plain click, or a
        // resize dragged past its opposite edge) - snap back up to a
        // minimum usable size instead of leaving an invisible selection.
        setRect(prev => {

            const natural = naturalSizeRef.current;

            if (!prev || !natural)
                return prev;

            const minWidth = Math.min(MIN_SIZE, natural.width);
            const minHeight = Math.min(MIN_SIZE, natural.height);

            const width = Math.max(prev.width, minWidth);
            const height = Math.max(prev.height, minHeight);

            return {
                x: clamp(prev.x, 0, natural.width - width),
                y: clamp(prev.y, 0, natural.height - height),
                width,
                height,
            };

        });

    }, [onDragMove]);

    // Guards against a leaked window listener if this modal is ever
    // unmounted mid-drag (e.g. its parent removes it from the tree for a
    // reason other than Cancel/Apply). onDragMove/onDragEnd are both
    // stable for the component's whole lifetime, so this always removes
    // exactly the pair that beginDrag/onOverlayMouseDown could have added.
    useEffect(() => {

        return () => {

            window.removeEventListener("mousemove", onDragMove);
            window.removeEventListener("mouseup", onDragEnd);

        };

    }, [onDragMove, onDragEnd]);

    const beginDrag = (mode: DragMode) => (e: React.MouseEvent) => {

        if (!rect)
            return;

        e.preventDefault();
        e.stopPropagation();

        dragRef.current = {
            mode,
            startClientX: e.clientX,
            startClientY: e.clientY,
            startRect: rect,
        };

        window.addEventListener("mousemove", onDragMove);
        window.addEventListener("mouseup", onDragEnd);

    };

    // Mousedown on the dimmed (unselected) area starts a brand-new
    // selection from scratch, anchored at that point.
    const onOverlayMouseDown = (e: React.MouseEvent) => {

        if (!naturalSizeRef.current)
            return;

        const point = toNaturalPoint(e.clientX, e.clientY);

        const startRect: CropRect = { x: point.x, y: point.y, width: 0, height: 0 };

        setRect(startRect);

        dragRef.current = {
            mode: "draw",
            startClientX: e.clientX,
            startClientY: e.clientY,
            startRect,
        };

        window.addEventListener("mousemove", onDragMove);
        window.addEventListener("mouseup", onDragEnd);

    };

    const handleReset = () => {

        if (!naturalSize)
            return;

        setRect({ x: 0, y: 0, width: naturalSize.width, height: naturalSize.height });

    };

    const handleApply = () => {

        if (!rect || !naturalSize || !imgRef.current)
            return;

        const x = Math.round(rect.x);
        const y = Math.round(rect.y);
        const width = Math.round(rect.width);
        const height = Math.round(rect.height);

        if (width < 1 || height < 1)
            return;

        // Real bitmap crop at the original's own pixel resolution - not
        // a capture of whatever size the preview happens to be rendered
        // at (see this file's own top comment).
        const canvas = document.createElement("canvas");

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d");

        if (!ctx)
            return;

        ctx.drawImage(imgRef.current, x, y, width, height, 0, 0, width, height);

        onApply(canvas.toDataURL("image/png"), { x, y, width, height });

    };

    // Screen-space rect (the natural-pixel selection scaled to the
    // currently displayed <img> size) - used only for drawing the
    // overlay/handles below; every actual crop computation above stays
    // in natural pixel coordinates throughout.
    const displayRect = (rect && naturalSize && displaySize)
        ? {
              x: rect.x * (displaySize.width / naturalSize.width),
              y: rect.y * (displaySize.height / naturalSize.height),
              width: rect.width * (displaySize.width / naturalSize.width),
              height: rect.height * (displaySize.height / naturalSize.height),
          }
        : null;

    return (

        <div className="crop-modal-overlay" onMouseDown={onCancel}>

            <div
                className="crop-modal"
                onMouseDown={e => e.stopPropagation()}
            >

                <div className="crop-modal-title">

                    이미지 크롭

                </div>

                <div className="crop-modal-canvas-wrap">

                    <img

                        ref={imgRef}

                        src={imageDataUrl}

                        alt="Crop target"

                        className="crop-modal-image"

                        draggable={false}

                        onLoad={onImageLoad}

                    />

                    {displayRect && (

                        <div

                            className="crop-modal-surface"

                            onMouseDown={onOverlayMouseDown}

                        >

                            <div
                                className="crop-modal-dim"
                                style={{ left: 0, top: 0, right: 0, height: displayRect.y }}
                            />

                            <div
                                className="crop-modal-dim"
                                style={{
                                    left: 0,
                                    top: displayRect.y + displayRect.height,
                                    right: 0,
                                    bottom: 0,
                                }}
                            />

                            <div
                                className="crop-modal-dim"
                                style={{
                                    left: 0,
                                    top: displayRect.y,
                                    width: displayRect.x,
                                    height: displayRect.height,
                                }}
                            />

                            <div
                                className="crop-modal-dim"
                                style={{
                                    left: displayRect.x + displayRect.width,
                                    top: displayRect.y,
                                    right: 0,
                                    height: displayRect.height,
                                }}
                            />

                            <div

                                className="crop-modal-selection"

                                style={{
                                    left: displayRect.x,
                                    top: displayRect.y,
                                    width: displayRect.width,
                                    height: displayRect.height,
                                }}

                                onMouseDown={beginDrag("move")}

                            >

                                <div className="crop-modal-handle nw" onMouseDown={beginDrag("nw")} />
                                <div className="crop-modal-handle ne" onMouseDown={beginDrag("ne")} />
                                <div className="crop-modal-handle sw" onMouseDown={beginDrag("sw")} />
                                <div className="crop-modal-handle se" onMouseDown={beginDrag("se")} />

                            </div>

                        </div>

                    )}

                </div>

                {naturalSize && rect && (

                    <div className="crop-modal-size-readout">

                        선택 영역: {Math.round(rect.width)} × {Math.round(rect.height)}px
                        &nbsp;(원본 {naturalSize.width} × {naturalSize.height}px)

                    </div>

                )}

                <div className="crop-modal-actions">

                    <button

                        className="crop-modal-apply"

                        disabled={!rect || rect.width < 1 || rect.height < 1}

                        onClick={handleApply}

                    >

                        적용

                    </button>

                    <button

                        className="crop-modal-reset"

                        onClick={handleReset}

                    >

                        초기화

                    </button>

                    <button

                        className="crop-modal-cancel"

                        onClick={onCancel}

                    >

                        취소

                    </button>

                </div>

            </div>

        </div>

    );

}

// ============================================================================
// End of File
// ============================================================================
