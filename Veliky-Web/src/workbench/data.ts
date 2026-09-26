import { create } from "zustand";
import { velikyVaultTree } from "../mock/velikyVaultData";
import type { FileNode } from "../lib/types";

export type TaskStatus = "Draft" | "Awaiting review" | "Completed" | "Declined";
export type Task = {
  id: string;
  title: string;
  category: string;
  status: TaskStatus;
  created: string;
  sample?: boolean;
  sourceIds?: string[];
};
export type Receipt = { id: string; title: string; detail: string; at: string };
export type LibraryFile = {
  id: string;
  name: string;
  category: string;
  content: string;
  local?: boolean;
  size?: number;
  file?: File;
};
export const sampleObjective =
  "Review P-204 inspection findings and draft a maintenance approval note.";
export const sampleNote = `# P-204 maintenance approval note\n\nDEMONSTRATION — based on sample project records, not live equipment data.\n\n## Objective\nReview bearing vibration and propose a maintenance inspection.\n\n## Findings\nInspection Report #62 records 5.4 mm/s vibration on 28 August 2026. Maintenance Report #184 cites a 2.8 mm/s baseline. Relative increase: ((5.4 - 2.8) / 2.8) × 100 = 92.86%.\n\n## Proposed action\nRequest an engineering review of pump alignment and NDE bearing condition. This note does not authorize equipment shutdown, maintenance dispatch, or expenditure.\n\n## Sources\n- Inspection-Report-62.md\n- Maintenance-Report-184.md\n- SOP-Pump-Maintenance.md\n\n## Verification boundary\nCalculation reproduced in browser JavaScript. Source claims are sample data; no sandbox, live inspection, or independent verification is represented.\n`;
function flatten(nodes: FileNode[]): LibraryFile[] {
  return nodes.flatMap((n) =>
    n.type === "folder"
      ? flatten(n.children || [])
      : [
          {
            id: n.path,
            name: n.name,
            category: n.path.split("/")[0],
            content:
              n.content || "No text preview is included in the sample library.",
          },
        ],
  );
}
export const librarySeed = flatten(velikyVaultTree);
const seedTasks: Task[] = [
  {
    id: "task-p204",
    title: "P-204 bearing inspection review",
    category: "Engineering review",
    status: "Awaiting review",
    created: "2026-09-14T08:30:00Z",
    sample: true,
  },
  {
    id: "task-c104",
    title: "C-104 compressor maintenance summary",
    category: "Document analysis",
    status: "Completed",
    created: "2026-09-13T10:15:00Z",
    sample: false,
  },
  {
    id: "task-vibration",
    title: "Vibration trend calculation",
    category: "Engineering calculation",
    status: "Completed",
    created: "2026-09-12T06:30:00Z",
    sample: false,
  },
  {
    id: "task-sop",
    title: "Compare pump maintenance procedures",
    category: "Document comparison",
    status: "Draft",
    created: "2026-09-11T07:20:00Z",
  },
];
const initial = {
  tasks: seedTasks,
  receipts: [
    {
      id: "receipt-initial",
      title: "P-204 review is ready",
      detail: "Sample approval note prepared with 3 referenced records.",
      at: "2026-09-14T08:30:00Z",
    },
  ],
  preferences: {
    name: "Alex Morgan",
    department: "Engineering & maintenance",
    model: "Automatic routing",
  },
  draft: "",
};
const key = "veliky-workbench-v1";
function readSaved() {
  try {
    const data = JSON.parse(localStorage.getItem(key) || "null");
    if (
      data &&
      Array.isArray(data.tasks) &&
      data.tasks.every(
        (t: Task) =>
          t &&
          typeof t.id === "string" &&
          typeof t.title === "string" &&
          ["Draft", "Awaiting review", "Completed", "Declined"].includes(
            t.status,
          ),
      ) &&
      Array.isArray(data.receipts) &&
      data.receipts.every(
        (r: Receipt) =>
          r && typeof r.title === "string" && typeof r.at === "string",
      ) &&
      typeof data.draft === "string" &&
      typeof data.preferences?.name === "string" &&
      typeof data.preferences?.department === "string" &&
      typeof data.preferences?.model === "string"
    )
      return data as typeof initial;
  } catch {
    /* Fall back to sample records when storage is unavailable or invalid. */
  }
  return initial;
}
type Store = typeof initial & {
  storageError: boolean;
  files: LibraryFile[];
  setDraft: (draft: string) => void;
  addTask: (title: string, category: string, sample?: boolean) => string;
  changeTask: (id: string, status: TaskStatus) => void;
  updateDraft: (id: string, title: string, sourceIds: string[]) => void;
  removeDraft: (id: string) => void;
  addFiles: (files: LibraryFile[]) => void;
  removeFile: (id: string) => void;
  savePreferences: (preferences: typeof initial.preferences) => void;
};
export const useWorkbench = create<Store>((set) => ({
  ...readSaved(),
  storageError: false,
  files: librarySeed,
  setDraft: (draft) => set({ draft }),
  addTask: (title, category, sample) => {
    const id = crypto.randomUUID();
    set((s) => ({
      tasks: [
        {
          id,
          title,
          category,
          sample,
          status: "Draft",
          created: new Date().toISOString(),
        },
        ...s.tasks,
      ],
      draft: "",
    }));
    return id;
  },
  updateDraft: (id, title, sourceIds) =>
    set((s) => ({
      tasks: s.tasks.map((t) =>
        t.id === id && t.status === "Draft" && !t.sample
          ? { ...t, title, sourceIds }
          : t,
      ),
    })),
  removeDraft: (id) =>
    set((s) => ({
      tasks: s.tasks.filter((t) => t.id !== id || t.status !== "Draft"),
    })),
  changeTask: (id, status) =>
    set((s) => ({
      tasks: s.tasks.map((t) => (t.id === id ? { ...t, status } : t)),
      receipts: [
        {
          id: crypto.randomUUID(),
          title:
            status === "Completed"
              ? "Demo approval recorded"
              : status === "Declined"
                ? "Demo request declined"
                : "Sample walkthrough completed",
          detail: `${s.tasks.find((t) => t.id === id)?.title || id} · ${status}. No external action executed.`,
          at: new Date().toISOString(),
        },
        ...s.receipts,
      ],
    })),
  addFiles: (files) => set((s) => ({ files: [...files, ...s.files] })),
  removeFile: (id) =>
    set((s) => ({ files: s.files.filter((f) => f.id !== id) })),
  savePreferences: (preferences) => set({ preferences }),
}));
useWorkbench.subscribe((state) => {
  try {
    localStorage.setItem(
      key,
      JSON.stringify({
        tasks: state.tasks,
        receipts: state.receipts,
        preferences: state.preferences,
        draft: state.draft,
      }),
    );
    if (state.storageError)
      queueMicrotask(() => useWorkbench.setState({ storageError: false }));
  } catch {
    if (!state.storageError)
      queueMicrotask(() => useWorkbench.setState({ storageError: true }));
  }
});
window.addEventListener("storage", (event) => {
  if (event.key === key) useWorkbench.setState(readSaved());
});
export const date = (value: string) => {
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime())
    ? "Date unavailable"
    : new Intl.DateTimeFormat("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
        timeZone: "Asia/Kolkata",
      }).format(parsed);
};
export const time = (value: string) => {
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime())
    ? "Time unavailable"
    : new Intl.DateTimeFormat("en-IN", {
        hour: "2-digit",
        minute: "2-digit",
        timeZone: "Asia/Kolkata",
      }).format(parsed) + " IST";
};
