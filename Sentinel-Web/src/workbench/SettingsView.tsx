import { Check, Cpu, LockKeyhole } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { MODEL_REGISTRY } from "../mock/sentinelData";
import { useWorkbench } from "./data";
import { Badge, Button, Modal, PageHeading } from "./ui";
import type { Navigate } from "./WorkbenchApp";
type Props = {
  item?: string;
  navigate: Navigate;
  notify?: (message: string) => void;
};
export function SettingsView({
  notify,
}: {
  notify: (message: string) => void;
}) {
  const { preferences, savePreferences } = useWorkbench();
  const [tab, setTab] = useState("Workspace");
  const [name, setName] = useState(preferences.name);
  const [department, setDepartment] = useState(preferences.department);
  const [model, setModel] = useState(preferences.model);
  const [error, setError] = useState("");
  const field = useRef<HTMLInputElement>(null);
  const [dirty, setDirty] = useState(false);
  const [discard, setDiscard] = useState(false);
  const [nextTab, setNextTab] = useState("Workspace");
  const pendingNavigation = useRef<(() => void) | null>(null);
  useEffect(() => {
    const guard = (event: Event) => {
      if (!dirty) return;
      event.preventDefault();
      pendingNavigation.current = (
        event as CustomEvent<{ resume: () => void }>
      ).detail.resume;
      setDiscard(true);
    };
    window.addEventListener("sentinel:before-navigate", guard);
    return () => window.removeEventListener("sentinel:before-navigate", guard);
  }, [dirty]);
  useEffect(() => {
    if (!dirty) {
      setName(preferences.name);
      setDepartment(preferences.department);
      setModel(preferences.model);
    }
  }, [preferences, dirty]);
  useEffect(() => {
    const warn = (e: BeforeUnloadEvent) => {
      if (dirty) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);
  return (
    <>
      <PageHeading
        title="Settings"
        description="Workspace preferences, local model readiness, and action boundaries."
      />
      <div className="settings-tabs" aria-label="Settings sections">
        {["Workspace", "Models & tools", "Access & privacy"].map((t) => (
          <button
            key={t}
            aria-pressed={tab === t}
            className={tab === t ? "active" : ""}
            onClick={() => {
              if (dirty) {
                pendingNavigation.current = null;
                setNextTab(t);
                setDiscard(true);
              } else setTab(t);
            }}
          >
            {t}
          </button>
        ))}
      </div>
      {tab === "Workspace" ? (
        <section className="panel settings-panel">
          <div className="panel-heading">
            <div>
              <h2>Workspace preferences</h2>
              <p>Personalize this browser's demo workspace.</p>
            </div>
          </div>
          <form
            className="settings-form"
            noValidate
            onSubmit={(e) => {
              e.preventDefault();
              if (!name.trim()) {
                setError("Enter a display name.");
                field.current?.focus();
                return;
              }
              savePreferences({
                name: name.trim(),
                department: department.trim(),
                model,
              });
              setDirty(false);
              notify("Workspace preferences saved.");
            }}
          >
            <div className="field">
              <label htmlFor="display-name">Display name</label>
              <input
                id="display-name"
                ref={field}
                maxLength={60}
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  setError("");
                  setDirty(true);
                }}
                aria-invalid={!!error}
                aria-describedby={error ? "name-error" : undefined}
              />
              {error && (
                <span className="field-error" id="name-error">
                  {error}
                </span>
              )}
            </div>
            <div className="field">
              <label htmlFor="department">Department</label>
              <input
                id="department"
                value={department}
                maxLength={80}
                onChange={(e) => {
                  setDepartment(e.target.value);
                  setDirty(true);
                }}
              />
            </div>
            <div className="field">
              <label htmlFor="model-routing">Preferred model routing</label>
              <select
                id="model-routing"
                value={model}
                onChange={(e) => {
                  setModel(e.target.value);
                  setDirty(true);
                }}
              >
                {[
                  "Automatic routing",
                  "Reasoning model",
                  "Vision model",
                  "Coding model",
                ].map((m) => (
                  <option key={m}>{m}</option>
                ))}
              </select>
              <small>
                Saved as a preference. No model backend is connected.
              </small>
            </div>
            <div className="field">
              <span className="field-label">Region & time</span>
              <p>English (India) · Indian Standard Time (UTC+05:30)</p>
            </div>
            <div className="form-actions">
              <span className="muted">
                {dirty ? "Unsaved changes" : "Saved in this browser"}
              </span>
              <Button variant="primary" type="submit">
                Save preferences
                <Check size={16} />
              </Button>
            </div>
          </form>
        </section>
      ) : tab === "Models & tools" ? (
        <>
          <div className="info-box">
            <Cpu size={18} />
            <span>
              No inference server connected. These are the project's proposed
              local model roles; availability and hardware usage have not been
              measured.
            </span>
          </div>
          <div className="model-grid">
            {MODEL_REGISTRY.map((m) => (
              <section className="panel model-card" key={m.id}>
                <div className="model-card-top">
                  <span className="document-icon purple">
                    <Cpu size={22} />
                  </span>
                  <Badge>Not connected</Badge>
                </div>
                <h3>{m.role}</h3>
                <p className="mono model-name">{m.name}</p>
                <p>{m.activeContext}</p>
                <div className="model-bottom">
                  <LockKeyhole size={14} />
                  Intended deployment: on premises
                </div>
              </section>
            ))}
          </div>
          <section className="panel spaced">
            <div className="panel-heading">
              <h2>Tool readiness</h2>
            </div>
            <div className="boundary-list">
              {[
                ["Local file preview", "Available in browser"],
                ["Knowledge retrieval & OCR", "Backend required"],
                ["Isolated code execution", "Backend required"],
                ["Word, Excel & PPT generation", "Backend required"],
                ["Network egress verification", "Backend required"],
              ].map(([title, status]) => (
                <div key={title}>
                  <span>{title}</span>
                  <Badge tone={status.includes("Available") ? "success" : ""}>
                    {status}
                  </Badge>
                </div>
              ))}
            </div>
          </section>
        </>
      ) : (
        <>
          <section className="panel settings-panel">
            <div className="panel-heading">
              <div>
                <h2>Action boundaries</h2>
                <p>
                  Intended policy from the project report. Real enforcement
                  belongs on the server.
                </p>
              </div>
              <LockKeyhole size={20} />
            </div>
            <div className="boundary-list">
              {[
                ["Read sample documents", "Available"],
                ["Add files to this tab", "User initiated"],
                ["Record a sample decision", "Review required"],
                ["Send data to external AI", "Not enabled"],
                ["Run shell commands", "Not enabled"],
                ["Delete files on disk", "Not enabled"],
                ["Control physical equipment", "Not enabled"],
              ].map(([title, status]) => (
                <div key={title}>
                  <span>{title}</span>
                  <Badge>{status}</Badge>
                </div>
              ))}
            </div>
          </section>
          <section className="panel settings-panel spaced">
            <div className="panel-heading">
              <h2>Data in this browser</h2>
            </div>
            <div className="panel-body">
              <p>
                Sample tasks, draft text, review receipts, and preferences are
                stored locally. Uploaded files stay in memory for this tab and
                disappear on reload.
              </p>
              <p>
                No cloud model connector is invoked by this frontend. A browser
                cannot independently prove a deployment is air-gapped.
              </p>
              <p className="muted">
                Organizational sign-in, role enforcement, retention controls,
                and immutable audit storage are integration requirements.
              </p>
            </div>
          </section>
        </>
      )}
      {discard && (
        <Modal
          title="Discard unsaved preferences?"
          onClose={() => setDiscard(false)}
        >
          <p>
            Your unsaved preferences will be replaced with the last saved
            values.
          </p>
          <div className="modal-actions">
            <Button onClick={() => setDiscard(false)}>Keep editing</Button>
            <Button
              variant="danger"
              onClick={() => {
                setDirty(false);
                setDiscard(false);
                if (pendingNavigation.current) {
                  pendingNavigation.current();
                  pendingNavigation.current = null;
                } else setTab(nextTab);
              }}
            >
              Discard changes
            </Button>
          </div>
        </Modal>
      )}
    </>
  );
}
