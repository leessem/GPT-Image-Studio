import { useRef, useState } from "react";
import "./ImageDrop.css";

interface DroppedImage {
  id: string;
  src: string;
  name: string;
}

export default function ImageDrop() {

  const [images, setImages] = useState<DroppedImage[]>([]);

  const [isDragging, setIsDragging] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);

  const addFiles = (files: FileList | null) => {

    if (!files)
      return;

    Array.from(files)
      .filter(file => file.type.startsWith("image/"))
      .forEach(file => {

        const reader = new FileReader();

        reader.onload = () => {

          setImages(prev => [
            ...prev,
            {
              id: crypto.randomUUID(),
              src: reader.result as string,
              name: file.name,
            },
          ]);

        };

        reader.readAsDataURL(file);

      });

  };

  const onDrop = (e: React.DragEvent<HTMLDivElement>) => {

    e.preventDefault();

    setIsDragging(false);

    addFiles(e.dataTransfer.files);

  };

  const onDragOver = (e: React.DragEvent<HTMLDivElement>) => {

    e.preventDefault();

    setIsDragging(true);

  };

  const onDragLeave = () => {

    setIsDragging(false);

  };

  const onClickDropZone = () => {

    inputRef.current?.click();

  };

  const onRemove = (id: string) => {

    setImages(prev => prev.filter(image => image.id !== id));

  };

  const onClear = () => {

    setImages([]);

  };

  return (
    <div className="image-panel">

      <div className="image-header">
        Images
      </div>

      <div
        className={`drop-zone ${isDragging ? "dragging" : ""}`}
        onDrop={onDrop}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onClick={onClickDropZone}
      >

        {images.length === 0 ? (

          <>

            <div className="drop-icon">

                🖼️

            </div>

            <h2>Drop Images</h2>

            <p>

                Drag & Drop
                <br />
                or Click

            </p>

          </>

        ) : (

          <div className="image-grid">

            {images.map(image => (

              <div key={image.id} className="image-thumb-wrap">

                <img
                  src={image.src}
                  alt={image.name}
                  className="image-thumb"
                />

                <button
                  className="image-thumb-remove"
                  onClick={e => {
                    e.stopPropagation();
                    onRemove(image.id);
                  }}
                >
                  ✕
                </button>

              </div>

            ))}

          </div>

        )}

      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="image-file-input"
        onChange={e => addFiles(e.target.files)}
      />

      <div className="image-footer">

        <button onClick={onClickDropZone}>Upload</button>

        <button onClick={onClear}>Clear</button>

      </div>

    </div>
  );
}
