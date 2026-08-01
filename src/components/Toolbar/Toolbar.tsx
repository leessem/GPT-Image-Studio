import "./Toolbar.css";

interface ToolbarProps {

    onNewJob: () => void;

    onGenerate: () => void;

    onSave: () => void;

}

export default function Toolbar({

    onNewJob,

    onGenerate,

    onSave,

}: ToolbarProps) {
  return (
    <div className="toolbar">

      <div className="toolbar-title">
        GPT Image Studio Pro
      </div>

      <div className="toolbar-buttons">

        <button onClick={onNewJob}>New Job</button>

        <button onClick={onGenerate}>Generate</button>

        <button onClick={onSave}>Save</button>

        <button disabled title="Coming soon">Settings</button>

      </div>

    </div>
  );
}
