import {
  Activity,
  ArrowRight,
  ArrowUpRight,
  Bell,
  BookOpen,
  Box,
  CheckCheck,
  ChevronRight,
  CircleHelp,
  Cpu,
  FileCheck2,
  FileText,
  FolderOpen,
  LayoutDashboard,
  LockKeyhole,
  Menu,
  Plus,
  Search as SearchIcon,
  Settings2,
  ShieldCheck,
  Sparkles,
  Workflow,
  X,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { INDUSTRIAL_ASSETS } from "../mock/velikyData";
import { date, sampleObjective, useWorkbench } from "./data";
import { Badge, Button, Empty, Modal, PageHeading, Search, Status } from "./ui";
import {
  ActivityView,
  ApprovalsView,
  AssetsView,
  DeliverablesView,
  LibraryView,
  SettingsView,
  WorkspaceView,
} from "./views";
import "./workbench.css";
export const navigation = [
  {
    id: "overview",
    label: "Overview",
    icon: LayoutDashboard,
    group: "WORKSPACE",
  },
  { id: "workspace", label: "AI workspace", icon: Sparkles },
  { id: "knowledge", label: "Knowledge library", icon: BookOpen },
  { id: "assets", label: "Asset register", icon: Box },
  {
    id: "approvals",
    label: "Approvals",
    icon: FileCheck2,
    group: "REVIEW & OUTPUT",
  },
  { id: "deliverables", label: "Deliverables", icon: FolderOpen },
  { id: "activity", label: "Activity log", icon: Activity },
  {
    id: "settings",
    label: "Settings",
    icon: Settings2,
    group: "ADMINISTRATION",
  },
];
export type Navigate = (view: string, item?: string) => void;
const aliases: Record<string, string> = {
  detection: "workspace",
  agent: "workspace",
  incidents: "approvals",
  reports: "deliverables",
  monitoring: "activity",
  analytics: "activity",
  threats: "assets",
  memory: "knowledge",
  graph: "assets",
};
function readRoute() {
  const params = new URLSearchParams(location.search);
  const raw = params.get("view") || "overview";
  return { view: aliases[raw] || raw, item: params.get("item") || "" };
}
export default function WorkbenchApp() {
  const [route, setRoute] = useState(readRoute);
  const [menu, setMenu] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [help, setHelp] = useState(false);
  const [query, setQuery] = useState("");
  const [notice, setNotice] = useState("");
  const [offline, setOffline] = useState(!navigator.onLine);
  const { tasks, files, preferences, storageError } = useWorkbench();
  const pending = tasks.filter((t) => t.status === "Awaiting review").length;
  const performNavigation: Navigate = (view, item) => {
    const url = new URL(location.href);
    url.searchParams.set("view", view);
    item ? url.searchParams.set("item", item) : url.searchParams.delete("item");
    history.pushState({}, "", url);
    setRoute({ view, item: item || "" });
    setMenu(false);
    setSearchOpen(false);
    window.scrollTo(0, 0);
  };
  const routeRef = useRef(route);
  routeRef.current = route;
  const navigate: Navigate = (view, item) => {
    const event = new CustomEvent("veliky:before-navigate", {
      cancelable: true,
      detail: { resume: () => performNavigation(view, item) },
    });
    if (window.dispatchEvent(event)) performNavigation(view, item);
  };
  useEffect(() => {
    const pop = () => {
      const destination = readRoute();
      const event = new CustomEvent("veliky:before-navigate", {
        cancelable: true,
        detail: {
          resume: () => performNavigation(destination.view, destination.item),
        },
      });
      if (window.dispatchEvent(event)) setRoute(destination);
      else {
        const current = routeRef.current;
        const url = new URL(location.href);
        url.searchParams.set("view", current.view);
        current.item
          ? url.searchParams.set("item", current.item)
          : url.searchParams.delete("item");
        history.pushState({}, "", url);
      }
    };
    const connected = () => setOffline(!navigator.onLine);
    const keys = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        setSearchOpen((s) => !s);
      }
    };
    window.addEventListener("popstate", pop);
    window.addEventListener("online", connected);
    window.addEventListener("offline", connected);
    window.addEventListener("keydown", keys);
    return () => {
      window.removeEventListener("popstate", pop);
      window.removeEventListener("online", connected);
      window.removeEventListener("offline", connected);
      window.removeEventListener("keydown", keys);
    };
  }, []);
  useEffect(() => {
    document.title = `${navigation.find((n) => n.id === route.view)?.label || "Page not found"} · Veliky`;
  }, [route.view]);
  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(() => setNotice(""), 5000);
    return () => clearTimeout(timer);
  }, [notice]);
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (storageError) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [storageError]);
  const nav = (
    <>
      <a
        className="brand"
        href="?view=overview"
        onClick={(e) => {
          e.preventDefault();
          navigate("overview");
        }}
      >
        <span className="brand-mark">
          <ShieldCheck size={23} />
        </span>
        <span>
          veliky<span className="brand-caption">INDUSTRIAL AI WORKBENCH</span>
        </span>
      </a>
      <div className="workspace-switch">
        <span className="workspace-avatar">U2</span>
        <div>
          <strong>Refinery workspace</strong>
          <span>Unit 2 · Engineering</span>
        </div>
        <LockKeyhole size={14} />
      </div>
      <nav aria-label="Main navigation">
        {navigation.map(({ id, label, icon: Icon, group }) => (
          <div key={id}>
            {group && <div className="nav-group">{group}</div>}
            <a
              className={`nav-link ${route.view === id ? "selected" : ""}`}
              href={`?view=${id}`}
              onClick={(e) => {
                e.preventDefault();
                navigate(id);
              }}
              aria-current={route.view === id ? "page" : undefined}
            >
              <Icon size={18} />
              <span>{label}</span>
              {id === "approvals" && pending > 0 && (
                <span className="nav-count">{pending}</span>
              )}
            </a>
          </div>
        ))}
      </nav>
      <div className="rail-bottom">
        <div className="local-status">
          <span className="local-icon">
            <Cpu size={18} />
          </span>
          <div>
            <strong>Local-first by design</strong>
            <span>Demo environment</span>
          </div>
        </div>
        <button className="profile-button" onClick={() => navigate("settings")}>
          <span className="avatar">
            {preferences.name
              .split(" ")
              .map((w) => w[0])
              .slice(0, 2)
              .join("") || "AM"}
          </span>
          <span>
            <strong>{preferences.name}</strong>
            <small>Engineering workspace</small>
          </span>
          <ChevronRight size={16} />
        </button>
      </div>
    </>
  );
  return (
    <div className="workbench">
      <a className="skip-link" href="#main-content">
        Skip to content
      </a>
      <aside className="rail">{nav}</aside>
      <div className="app-content">
        <header className="topbar">
          <div className="topbar-location">
            <button
              className="icon-button mobile-menu"
              onClick={() => setMenu(true)}
              aria-label="Open navigation"
            >
              <Menu size={21} />
            </button>
            <span className="crumb-parent">Workspace</span>
            <ChevronRight size={14} />
            <strong>
              {navigation.find((n) => n.id === route.view)?.label ||
                "Page not found"}
            </strong>
          </div>
          <div className="topbar-actions">
            <button
              className="global-search"
              onClick={() => setSearchOpen(true)}
            >
              <SearchIcon size={16} />
              <span>Search workspace</span>
              <kbd>Ctrl K</kbd>
            </button>
            <Badge tone="demo">Demo data</Badge>
            <button
              className="icon-button"
              onClick={() => navigate("approvals")}
              aria-label={`${pending} approvals awaiting review`}
            >
              <Bell size={19} />
              {pending > 0 && <span className="notification-dot" />}
            </button>
            <button
              className="avatar small"
              onClick={() => navigate("settings")}
              aria-label="Open your preferences"
            >
              {preferences.name[0] || "A"}
            </button>
          </div>
        </header>
        {offline && (
          <div className="system-banner" role="status">
            You're offline. Sample workflows and local files are still
            available.
          </div>
        )}
        {storageError && (
          <div className="system-banner error" role="alert">
            Browser storage is unavailable. Keep this tab open to preserve your
            changes.
          </div>
        )}
        <main id="main-content" tabIndex={-1} className="main-content">
          {route.view === "overview" ? (
            <Overview navigate={navigate} />
          ) : route.view === "workspace" ? (
            <WorkspaceView
              item={route.item}
              navigate={navigate}
              notify={setNotice}
            />
          ) : route.view === "knowledge" ? (
            <LibraryView
              item={route.item}
              navigate={navigate}
              notify={setNotice}
            />
          ) : route.view === "assets" ? (
            <AssetsView item={route.item} navigate={navigate} />
          ) : route.view === "approvals" ? (
            <ApprovalsView
              item={route.item}
              navigate={navigate}
              notify={setNotice}
            />
          ) : route.view === "deliverables" ? (
            <DeliverablesView notify={setNotice} />
          ) : route.view === "activity" ? (
            <ActivityView notify={setNotice} />
          ) : route.view === "settings" ? (
            <SettingsView notify={setNotice} />
          ) : (
            <Empty
              title="This page doesn't exist"
              description="Return to the overview to continue your work."
              action={
                <Button onClick={() => navigate("overview")}>
                  Go to overview
                </Button>
              }
            />
          )}
          <footer className="page-footer">
            <span>
              <ShieldCheck size={14} /> Veliky · Built for work that stays
              yours
            </span>
            <button onClick={() => setHelp(true)}>
              <CircleHelp size={14} /> Workspace guide
            </button>
          </footer>
        </main>
      </div>
      <div className="toast-region" role="status" aria-live="polite">
        {notice && (
          <div className="toast">
            <CheckCheck size={18} />
            {notice}
            <button
              aria-label="Dismiss notification"
              onClick={() => setNotice("")}
            >
              <X size={16} />
            </button>
          </div>
        )}
      </div>
      {menu && (
        <Modal title="Navigation" onClose={() => setMenu(false)}>
          <div className="mobile-navigation">{nav}</div>
        </Modal>
      )}
      {searchOpen && (
        <Modal
          title="Search your workspace"
          onClose={() => setSearchOpen(false)}
        >
          <Search
            value={query}
            onChange={setQuery}
            placeholder="Search tasks, documents, and assets"
          />
          <div className="search-results">
            {!query.trim() ? (
              <Empty
                title="Find your next piece of context"
                description="Search task titles or document names. Shortcut: Ctrl K."
              />
            ) : (
              <>
                {tasks
                  .filter((t) =>
                    t.title.toLowerCase().includes(query.toLowerCase()),
                  )
                  .slice(0, 6)
                  .map((t) => (
                    <button
                      key={t.id}
                      onClick={() => navigate("workspace", t.id)}
                    >
                      <Sparkles size={18} />
                      <span>
                        {t.title}
                        <small>AI workspace · {t.status}</small>
                      </span>
                      <ArrowUpRight size={16} />
                    </button>
                  ))}
                {files
                  .filter((f) =>
                    f.name.toLowerCase().includes(query.toLowerCase()),
                  )
                  .slice(0, 8)
                  .map((f) => (
                    <button
                      key={f.id}
                      onClick={() => navigate("knowledge", f.id)}
                    >
                      <FileText size={18} />
                      <span>
                        {f.name}
                        <small>Knowledge library · {f.category}</small>
                      </span>
                      <ArrowUpRight size={16} />
                    </button>
                  ))}
                {INDUSTRIAL_ASSETS.filter((a) =>
                  (a.name + " " + a.id)
                    .toLowerCase()
                    .includes(query.toLowerCase()),
                )
                  .slice(0, 6)
                  .map((a) => (
                    <button key={a.id} onClick={() => navigate("assets", a.id)}>
                      <Box size={18} />
                      <span>
                        {a.name}
                        <small>Asset register · {a.unit}</small>
                      </span>
                      <ArrowUpRight size={16} />
                    </button>
                  ))}
                {!INDUSTRIAL_ASSETS.some((a) =>
                  (a.name + " " + a.id)
                    .toLowerCase()
                    .includes(query.toLowerCase()),
                ) &&
                  !tasks.some((t) =>
                    t.title.toLowerCase().includes(query.toLowerCase()),
                  ) &&
                  !files.some((f) =>
                    f.name.toLowerCase().includes(query.toLowerCase()),
                  ) && <Empty />}
              </>
            )}
          </div>
        </Modal>
      )}
      {help && (
        <Modal
          title="Your work, from goal to deliverable"
          onClose={() => setHelp(false)}
        >
          <div className="guide">
            <p>
              Veliky brings local knowledge, planned work, human review, and
              traceable outputs into one workspace.
            </p>
            {[
              "Start with a goal in AI workspace.",
              "Review source records in Knowledge library.",
              "Run the P-204 sample to explore a step-by-step workflow.",
              "Review the exact approval note in Approvals.",
              "Download sample outputs and inspect Activity log.",
            ].map((step, i) => (
              <div key={step}>
                <span className="step-number">{i + 1}</span>
                {step}
              </div>
            ))}
            <div className="info-box">
              This frontend uses sample records. Local model inference, OCR,
              sandbox execution, organizational authentication, and network
              monitoring require a connected backend. Local uploads stay in this
              browser tab.
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
function Overview({ navigate }: { navigate: Navigate }) {
  const { tasks, files, preferences, draft, setDraft, addTask } =
    useWorkbench();
  const pending = tasks.filter((t) => t.status === "Awaiting review");
  const completed = tasks.filter((t) => t.status === "Completed");
  const [error, setError] = useState("");
  const input = useRef<HTMLTextAreaElement>(null);
  const start = () => {
    if (draft.trim().length < 12) {
      setError("Describe your goal in at least 12 characters.");
      input.current?.focus();
      return;
    }
    const id = addTask(
      draft.trim(),
      "Custom task",
      draft.trim() === sampleObjective,
    );
    navigate("workspace", id);
  };
  return (
    <>
      <PageHeading
        eyebrow="YOUR WORKSPACE, AT A GLANCE"
        title={`Let's get to work, ${preferences.name.split(" ")[0] || "Alex"}.`}
        description="Turn your team's knowledge into work you can trust."
        action={
          <Button onClick={() => navigate("knowledge")}>
            <Plus size={16} />
            Add knowledge
          </Button>
        }
      />
      <section className="goal-composer">
        <div className="composer-top">
          <span className="sparkle-tile">
            <Sparkles size={20} />
          </span>
          <div>
            <h2>What would you like to work on?</h2>
            <p>
              Give Veliky a goal. Get a plan, grounded answers, and a
              reviewable result.
            </p>
          </div>
          <span className="composer-watermark" aria-hidden="true">
            <Workflow size={94} strokeWidth={0.8} />
          </span>
        </div>
        <form
          noValidate
          onSubmit={(e) => {
            e.preventDefault();
            start();
          }}
        >
          <label className="sr-only" htmlFor="overview-goal">
            Describe your goal
          </label>
          <textarea
            className="resize-none"
            style={{ resize: "none" }}
            id="overview-goal"
            ref={input}
            value={draft}
            maxLength={2000}
            onChange={(e) => {
              setDraft(e.target.value);
              setError("");
            }}
            placeholder="e.g. Review the P-204 inspection report and draft a maintenance approval note…"
            aria-invalid={!!error}
            aria-describedby={error ? "goal-error" : undefined}
          />
          <div className="composer-bottom">
            <span>
              <LockKeyhole size={14} />
              Local demo workspace
            </span>
            <Button variant="primary" type="submit">
              Start a task
              <ArrowRight size={17} />
            </Button>
          </div>
          {error && (
            <p className="field-error" id="goal-error">
              {error}
            </p>
          )}
        </form>
        <div className="prompt-row">
          <span>Try a sample</span>
          {[
            { label: "Review an inspection", icon: FileText },
            { label: "Check a calculation", icon: CheckCheck },
            { label: "Draft an approval note", icon: FileCheck2 },
          ].map(({ label, icon: Icon }) => (
            <button
              key={label}
              onClick={() => {
                setDraft(sampleObjective);
                setError("");
                input.current?.focus();
              }}
            >
              <Icon size={14} />
              {label}
              <ArrowUpRight size={12} />
            </button>
          ))}
        </div>
      </section>
      <section className="metrics" aria-label="Workspace summary">
        {[
          {
            label: "Active tasks",
            value: tasks.filter(
              (t) => t.status === "Draft" || t.status === "Awaiting review",
            ).length,
            sub: "Across your workspace",
            icon: Workflow,
            view: "workspace",
            tone: "purple",
          },
          {
            label: "Awaiting your review",
            value: pending.length,
            sub: pending.length
              ? "Ready for a decision"
              : "You’re all caught up",
            icon: FileCheck2,
            view: "approvals",
            tone: "amber",
          },
          {
            label: "Knowledge sources",
            value: files.length,
            sub: "Documents in your library",
            icon: BookOpen,
            view: "knowledge",
            tone: "blue",
          },
          {
            label: "Completed tasks",
            value: completed.length,
            sub: "Sample outputs available",
            icon: CheckCheck,
            view: "deliverables",
            tone: "green",
          },
        ].map(({ label, value, sub, icon: Icon, view, tone }) => (
          <button
            key={label}
            className="metric-card"
            onClick={() => navigate(view)}
          >
            <div>
              <span className={`metric-icon ${tone}`}>
                <Icon size={18} />
              </span>
              <ArrowUpRight size={15} />
            </div>
            <strong>{value.toString().padStart(2, "0")}</strong>
            <span className="metric-label">{label}</span>
            <small>{sub}</small>
          </button>
        ))}
      </section>
      <div className="overview-columns">
        <section className="panel tasks-panel">
          <div className="panel-heading">
            <div>
              <h2>Recent work</h2>
              <p>Pick up where you left off.</p>
            </div>
            <Button variant="ghost" onClick={() => navigate("workspace")}>
              View all
              <ArrowRight size={15} />
            </Button>
          </div>
          <div className="recent-list">
            {tasks.slice(0, 4).map((t) => (
              <button
                className="recent-task"
                key={t.id}
                onClick={() => navigate("workspace", t.id)}
              >
                <span
                  className={`document-icon ${t.status === "Completed" ? "green" : "purple"}`}
                >
                  {t.category.includes("calculation") ? (
                    <CheckCheck size={20} />
                  ) : (
                    <FileText size={20} />
                  )}
                </span>
                <span className="task-info">
                  <strong>{t.title}</strong>
                  <small>
                    {t.category} <span>·</span> {date(t.created)}
                  </small>
                </span>
                <Status value={t.status} />
                <ChevronRight size={16} />
              </button>
            ))}
          </div>
          <div className="panel-footnote">
            <LockKeyhole size={13} />
            Your tasks and sample review decisions are saved in this browser.
          </div>
        </section>
        <section className="panel attention-panel">
          <div className="panel-heading">
            <div className="attention-heading">
              <span className="attention-dot" />
              <h2>Needs your attention</h2>
            </div>
            <Badge>{pending.length}</Badge>
          </div>
          {pending.length ? (
            <div className="attention-content">
              <Badge tone="warning">Approval required</Badge>
              <h3>{pending[0].title}</h3>
              <p>
                A draft approval note is ready. Review the source evidence
                before recording your decision.
              </p>
              <div className="evidence-mini">
                <span className="file-stack">
                  <FileText size={17} />
                  <FileText size={17} />
                  <FileText size={17} />
                </span>
                <span>3 source records attached</span>
              </div>
              <Button onClick={() => navigate("approvals", pending[0].id)}>
                Review request
                <ArrowRight size={16} />
              </Button>
              <span className="muted small-text">
                Demo request · No external action
              </span>
            </div>
          ) : (
            <Empty
              title="You're all caught up"
              description="New approval requests will appear here."
            />
          )}
        </section>
      </div>
      <section className="panel knowledge-overview">
        <div className="panel-heading">
          <div>
            <h2>A foundation for better answers</h2>
            <p>Bring the right knowledge into every task.</p>
          </div>
          <Button variant="ghost" onClick={() => navigate("knowledge")}>
            Explore library
            <ArrowRight size={15} />
          </Button>
        </div>
        <div className="knowledge-categories">
          {[
            {
              title: "Engineering records",
              desc: "Equipment specifications & manuals",
              icon: Box,
              q: "Equipment",
            },
            {
              title: "Reports & inspections",
              desc: "Observations, measurements & findings",
              icon: FileText,
              q: "Reports",
            },
            {
              title: "Procedures & standards",
              desc: "Internal SOPs & reference material",
              icon: BookOpen,
              q: "SOPs",
            },
          ].map(({ title, desc, icon: Icon }) => (
            <button key={title} onClick={() => navigate("knowledge")}>
              <span className="category-icon">
                <Icon size={22} />
              </span>
              <div>
                <strong>{title}</strong>
                <small>{desc}</small>
              </div>
              <ChevronRight size={16} />
            </button>
          ))}
        </div>
      </section>
    </>
  );
}
