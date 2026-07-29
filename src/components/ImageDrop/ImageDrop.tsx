import "./ImageDrop.css";

export default function ImageDrop() {
  return (
    <div className="image-panel">

      <div className="image-header">
        Images
      </div>

      <div className="drop-zone">

        <div className="drop-icon">

            🖼️

        </div>

        <h2>Drop Images</h2>

        <p>

            Drag & Drop
            <br />
            or Click

        </p>

      </div>

      <div className="image-footer">

        <button>Upload</button>

        <button>Clear</button>

      </div>

    </div>
  );
}