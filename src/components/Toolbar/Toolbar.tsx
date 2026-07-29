import "./Toolbar.css";

export default function Toolbar() {
  return (
    <div className="toolbar">

      <div className="toolbar-title">
        GPT Image Studio Pro
      </div>

      <div className="toolbar-buttons">

        <button>New Job</button>

        <button>Generate</button>

        <button>Save</button>

        <button>Settings</button>

      </div>

    </div>
  );
}