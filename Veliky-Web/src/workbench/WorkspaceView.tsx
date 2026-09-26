import {
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  Check,
  ChevronRight,
  Code2,
  FileCheck2,
  FileText,
  LockKeyhole,
  Play,
  Plus,
  Search as SearchIcon,
  ShieldCheck,
  Sparkles,
  Square,
  Trash2,
  Workflow,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { INCIDENT_CASES } from "../mock/velikyData";
import { date, sampleObjective, useWorkbench, type Task } from "./data";
import {
  Badge,
  Button,
  Empty,
  Modal,
  PageHeading,
  Pagination,
  Search,
  Status,
} from "./ui";
import type { Navigate } from "./WorkbenchApp";
type Props = {
  item?: string;
  navigate: Navigate;
  notify?: (message: string) => void;
};
const steps = [
  {
    title: "Retrieve context",
    text: "Read the inspection, maintenance, and procedure sample records.",
    icon: SearchIcon,
  },
  {
    title: "Compare measurements",
    text: "Compare 5.4 mm/s with the documented 2.8 mm/s baseline.",
    icon: Workflow,
  },
  {
    title: "Check the calculation",
    text: "Reproduce the 92.86% increase using browser arithmetic.",
    icon: Code2,
  },
  {
    title: "Draft a review note",
    text: "Prepare a sample note with explicit source references.",
    icon: FileText,
  },
  {
    title: "Request human review",
    text: "Stop for review before any proposed operational action.",
    icon: FileCheck2,
  },
];
export function WorkspaceView({ item, navigate, notify }: Props) {
  const { tasks, draft, setDraft, addTask, changeTask, files } = useWorkbench();
  const [editing, setEditing] = useState(false);
  const [deleteDraft, setDeleteDraft] = useState(false);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("All tasks");
  const [page, setPage] = useState(1);
  const [error, setError] = useState("");
  const [running, setRunning] = useState(false);
  const [step, setStep] = useState(-1);
  const input = useRef<HTMLTextAreaElement>(null);
  const task = tasks.find((t) => t.id === item);
  useEffect(() => {
    setRunning(false);
    setStep(-1);
  }, [item]);
  useEffect(() => {
    if (!running || !task) return;
    const timer = setTimeout(() => {
      if (step < steps.length - 1) setStep((s) => s + 1);
      else {
        changeTask(task.id, "Awaiting review");
        setRunning(false);
        notify?.("Sample walkthrough complete. The note is ready for review.");
      }
    }, 850);
    return () => clearTimeout(timer);
  }, [running, step, task, changeTask, notify]);
  const matches = tasks.filter(
    (t) =>
      t.title.toLowerCase().includes(query.toLowerCase()) &&
      (filter === "All tasks" || t.status === filter),
  );
  const currentPage = Math.min(
    page,
    Math.max(1, Math.ceil(matches.length / 6)),
  );
  const create = (sample = false) => {
    const title = sample ? sampleObjective : draft.trim();
    if (title.length < 12) {
      setError("Describe your objective in at least 12 characters.");
      input.current?.focus();
      return;
    }
    const id = addTask(
      title,
      sample ? "Engineering review" : "Custom task",
      sample,
    );
    navigate("workspace", id);
    setError("");
  };
  const selectedSources = files.filter((f) => task?.sourceIds?.includes(f.id));
  if (item && !task)
    return (
      <Empty
        title="Task not found"
        description="This task may belong to another browser workspace."
        action={
          <Button onClick={() => navigate("workspace")}>Back to tasks</Button>
        }
      />
    );
  if (task)
    return (
      <>
        <Button variant="ghost" onClick={() => navigate("workspace")}>
          <ArrowLeft size={16} />
          All tasks
        </Button>
        <PageHeading
          eyebrow="AI WORKSPACE"
          title={task.title}
          description={`${task.category} · Created ${date(task.created)}`}
          action={
            <div className="heading-actions">
              <Status value={task.status} />
              {task.status === "Draft" && !task.sample && (
                <Button onClick={() => setEditing(true)}>Edit draft</Button>
              )}
              {task.status === "Draft" && (
                <Button
                  variant="ghost"
                  onClick={() => setDeleteDraft(true)}
                  aria-label="Delete draft"
                >
                  <Trash2 size={16} />
                </Button>
              )}
            </div>
          }
        />
        <div className="detail-columns">
          <div>
            <section className="panel">
              <div className="panel-heading">
                <div>
                  <h2>Task objective</h2>
                  <p>A clear plan before any action.</p>
                </div>
                <Sparkles size={20} />
              </div>
              <div className="panel-body">
                <p>{task.sample ? sampleObjective : task.title}</p>
                <div className="info-box">
                  <LockKeyhole size={18} />
                  <span>
                    {task.sample
                      ? "This is a guided sample using project records. No model inference, sandbox execution, or equipment control takes place."
                      : task.status === "Completed"
                        ? "This task contains an illustrative sample output, available in Deliverables. No live model run was performed."
                        : "Draft saved. A local model backend is required to generate a grounded plan and carry out this custom objective."}
                  </span>
                </div>
              </div>
            </section>
            <section className="panel spaced">
              <div className="panel-heading">
                <h2>{task.sample ? "Execution plan" : "Task readiness"}</h2>
                <Badge>
                  {task.sample ? "Sample walkthrough" : "Not executed"}
                </Badge>
              </div>
              {task.sample ? (
                <div className="step-list">
                  {steps.map(({ title, text, icon: Icon }, i) => (
                    <div
                      className={`execution-step ${running && i === step ? "current" : ""}`}
                      key={title}
                    >
                      <span
                        className={`step-number ${(running && i < step) || task.status !== "Draft" ? "done" : ""}`}
                      >
                        {(running && i < step) || task.status !== "Draft" ? (
                          <Check size={17} />
                        ) : (
                          <Icon size={17} />
                        )}
                      </span>
                      <div>
                        <h3>{title}</h3>
                        <p>{text}</p>
                      </div>
                      {running && i === step && (
                        <Badge tone="purple">In progress</Badge>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="panel-body">
                  <p className="muted">
                    {task.status === "Completed"
                      ? "A sample output for this task is available in Deliverables. No live execution history is available."
                      : "Connect an on-premise model and select source documents to generate a task-specific plan. This draft has not been executed."}
                  </p>
                </div>
              )}
              <div className="panel-actions">
                {task.status === "Draft" && task.sample ? (
                  <>
                    <Button
                      variant="primary"
                      disabled={running}
                      onClick={() => {
                        setStep(0);
                        setRunning(true);
                      }}
                    >
                      <Play size={16} />
                      {running
                        ? "Walking through sample…"
                        : "Run sample walkthrough"}
                    </Button>
                    {running && (
                      <Button
                        onClick={() => {
                          setRunning(false);
                          setStep(-1);
                          notify?.("Sample paused. Your draft is unchanged.");
                        }}
                      >
                        <Square size={14} />
                        Cancel walkthrough
                      </Button>
                    )}
                  </>
                ) : task.status === "Awaiting review" ? (
                  <Button
                    variant="primary"
                    onClick={() => navigate("approvals", task.id)}
                  >
                    Review approval note
                    <ArrowRight size={16} />
                  </Button>
                ) : task.status === "Completed" ? (
                  <Button onClick={() => navigate("deliverables")}>
                    View deliverables
                    <ArrowRight size={16} />
                  </Button>
                ) : !task.sample ? (
                  <Button onClick={() => navigate("settings")}>
                    View model setup
                    <ArrowRight size={16} />
                  </Button>
                ) : (
                  <p className="muted">
                    Request declined. No action was taken.
                  </p>
                )}
              </div>
              <div role="status" className="sr-only">
                {running
                  ? `Sample step ${step + 1} of ${steps.length}: ${steps[step]?.title}`
                  : ""}
              </div>
            </section>
            {task.sample && (
              <section className="panel spaced">
                <div className="panel-heading">
                  <h2>Calculation preview</h2>
                  <Badge tone="success">Reproducible arithmetic</Badge>
                </div>
                <div className="calculation">
                  <code>((5.4 − 2.8) ÷ 2.8) × 100</code>
                  <strong>
                    {(((5.4 - 2.8) / 2.8) * 100).toFixed(2)}
                    <small>% increase</small>
                  </strong>
                </div>
                <p className="panel-footnote">
                  Calculated in this browser from sample values. This is not a
                  sandbox verification.
                </p>
              </section>
            )}
          </div>
          <aside>
            <section className="panel">
              <div className="panel-heading">
                <h2>Source context</h2>
                <BookOpen size={18} />
              </div>
              {task.sample ? (
                <div className="source-list">
                  {INCIDENT_CASES[0].evidence.map((e) => (
                    <button
                      key={e.documentName}
                      onClick={() =>
                        navigate(
                          "knowledge",
                          files.find((f) => f.name === e.documentName)?.id,
                        )
                      }
                    >
                      <FileText size={18} />
                      <span>
                        <strong>{e.title}</strong>
                        <small>{e.documentName}</small>
                      </span>
                      <ArrowUpRight size={15} />
                    </button>
                  ))}
                </div>
              ) : (
                <div className="panel-body">
                  {selectedSources.length ? (
                    <div className="source-list">
                      {selectedSources.map((file) => (
                        <button
                          key={file.id}
                          onClick={() => navigate("knowledge", file.id)}
                        >
                          <FileText size={16} />
                          <span>{file.name}</span>
                          <ArrowUpRight size={14} />
                        </button>
                      ))}
                    </div>
                  ) : (
                    <p className="muted">No sources attached to this task.</p>
                  )}
                  {task.status === "Draft" && (
                    <Button onClick={() => setEditing(true)}>
                      Attach source records
                    </Button>
                  )}
                  <Button onClick={() => navigate("knowledge")}>
                    Browse knowledge library
                  </Button>
                </div>
              )}
            </section>
            <section className="panel spaced">
              <div className="panel-heading">
                <h2>Action boundaries</h2>
                <ShieldCheck size={18} />
              </div>
              <div className="boundary-list">
                <div>
                  <span>Read sample records</span>
                  <Badge tone="success">Allowed</Badge>
                </div>
                <div>
                  <span>Create a local draft</span>
                  <Badge tone="success">Allowed</Badge>
                </div>
                <div>
                  <span>Operational changes</span>
                  <Badge tone="warning">Review first</Badge>
                </div>
                <div>
                  <span>Equipment commands</span>
                  <Badge>Unavailable</Badge>
                </div>
              </div>
            </section>
          </aside>
        </div>
        {editing && (
          <DraftEditor
            task={task}
            onClose={() => setEditing(false)}
            notify={notify}
          />
        )}
        {deleteDraft && (
          <Modal
            title="Delete this draft?"
            onClose={() => setDeleteDraft(false)}
          >
            <p>
              Remove <strong>{task.title}</strong> from this browser workspace?
              Source documents will stay in the library.
            </p>
            <div className="modal-actions">
              <Button onClick={() => setDeleteDraft(false)}>Keep draft</Button>
              <Button
                variant="danger"
                onClick={() => {
                  useWorkbench.getState().removeDraft(task.id);
                  setDeleteDraft(false);
                  navigate("workspace");
                  notify?.("Draft deleted. Source documents are unchanged.");
                }}
              >
                Delete draft
              </Button>
            </div>
          </Modal>
        )}
      </>
    );
  return (
    <>
      <PageHeading
        title="AI workspace"
        description="Start with an objective. Keep the plan, context, and outcome together."
        action={
          <Button onClick={() => input.current?.focus()}>
            <Plus size={16} />
            New task
          </Button>
        }
      />
      <section className="panel task-create">
        <form
          noValidate
          onSubmit={(e) => {
            e.preventDefault();
            create();
          }}
        >
          <label htmlFor="task-goal">What do you need to get done?</label>
          <textarea
            className="resize-none"
            style={{ resize: "none" }}
            id="task-goal"
            ref={input}
            value={draft}
            maxLength={2000}
            onChange={(e) => {
              setDraft(e.target.value);
              setError("");
            }}
            placeholder="Describe a document review, engineering calculation, or coding task…"
            aria-invalid={!!error}
            aria-describedby={error ? "task-error" : undefined}
          />
          {error && (
            <p id="task-error" className="field-error">
              {error}
            </p>
          )}
          <div className="form-actions">
            <Button onClick={() => create(true)}>
              <Play size={15} />
              Try the P-204 sample
            </Button>
            <Button variant="primary" type="submit">
              Create task
              <ArrowRight size={16} />
            </Button>
          </div>
        </form>
      </section>
      <section className="panel spaced">
        <div className="list-toolbar">
          <Search
            value={query}
            onChange={(v) => {
              setQuery(v);
              setPage(1);
            }}
            placeholder="Search tasks"
          />
          <label className="select-label">
            Status
            <select
              value={filter}
              onChange={(e) => {
                setFilter(e.target.value);
                setPage(1);
              }}
            >
              {[
                "All tasks",
                "Draft",
                "Awaiting review",
                "Completed",
                "Declined",
              ].map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
          </label>
        </div>
        {matches.length ? (
          <div className="recent-list">
            {matches.slice((currentPage - 1) * 6, currentPage * 6).map((t) => (
              <button
                className="recent-task"
                key={t.id}
                onClick={() => navigate("workspace", t.id)}
              >
                <span className="document-icon purple">
                  <FileText size={20} />
                </span>
                <span className="task-info">
                  <strong>{t.title}</strong>
                  <small>
                    {t.category} · {date(t.created)}
                  </small>
                </span>
                <Status value={t.status} />
                <ChevronRight size={16} />
              </button>
            ))}
          </div>
        ) : (
          <Empty
            action={
              <Button
                onClick={() => {
                  setQuery("");
                  setFilter("All tasks");
                }}
              >
                Clear filters
              </Button>
            }
          />
        )}
        <Pagination
          page={currentPage}
          total={matches.length}
          onChange={setPage}
        />
      </section>
    </>
  );
}

function DraftEditor({
  task,
  onClose,
  notify,
}: {
  task: Task;
  onClose: () => void;
  notify?: (message: string) => void;
}) {
  const { files, updateDraft } = useWorkbench();
  const [title, setTitle] = useState(task.title);
  const [sourceIds, setSourceIds] = useState(task.sourceIds || []);
  const [query, setQuery] = useState("");
  const [error, setError] = useState("");
  const [discard, setDiscard] = useState(false);
  const field = useRef<HTMLTextAreaElement>(null);
  const dirty =
    title !== task.title ||
    JSON.stringify(sourceIds) !== JSON.stringify(task.sourceIds || []);
  const close = () => {
    if (dirty) setDiscard(true);
    else onClose();
  };
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
    <Modal title="Edit task draft" onClose={close} wide>
      <form
        noValidate
        onSubmit={(e) => {
          e.preventDefault();
          if (title.trim().length < 12) {
            setError("Describe your objective in at least 12 characters.");
            field.current?.focus();
            return;
          }
          updateDraft(task.id, title.trim(), sourceIds);
          onClose();
          notify?.("Task draft updated.");
        }}
      >
        <div className="field">
          <label htmlFor="edit-objective">Task objective</label>
          <textarea
            className="resize-none"
            id="edit-objective"
            ref={field}
            value={title}
            maxLength={2000}
            onChange={(e) => {
              setTitle(e.target.value);
              setError("");
            }}
            aria-invalid={!!error}
            aria-describedby={error ? "edit-error" : undefined}
          />
          {error && (
            <p id="edit-error" className="field-error">
              {error}
            </p>
          )}
        </div>
        <fieldset className="source-picker">
          <legend>Source records · {sourceIds.length} selected</legend>
          <p className="muted small-text">
            Local file references last for this tab. Sample record references
            persist.
          </p>
          <Search
            value={query}
            onChange={setQuery}
            placeholder="Filter source records"
          />
          <div className="source-options">
            {files
              .filter((f) => f.name.toLowerCase().includes(query.toLowerCase()))
              .map((f) => (
                <label key={f.id}>
                  <input
                    type="checkbox"
                    checked={sourceIds.includes(f.id)}
                    onChange={(e) =>
                      setSourceIds((ids) =>
                        e.target.checked
                          ? [...ids, f.id]
                          : ids.filter((id) => id !== f.id),
                      )
                    }
                  />
                  <FileText size={15} />
                  <span>
                    {f.name}
                    <small>{f.local ? "Local file" : "Sample record"}</small>
                  </span>
                </label>
              ))}
          </div>
        </fieldset>
        {discard ? (
          <div className="decision-box">
            <p>Discard your unsaved draft changes?</p>
            <div className="modal-actions">
              <Button onClick={() => setDiscard(false)}>Keep editing</Button>
              <Button variant="danger" onClick={onClose}>
                Discard changes
              </Button>
            </div>
          </div>
        ) : (
          <div className="modal-actions">
            <Button onClick={close}>Cancel</Button>
            <Button type="submit" variant="primary">
              Save draft
            </Button>
          </div>
        )}
      </form>
    </Modal>
  );
}
