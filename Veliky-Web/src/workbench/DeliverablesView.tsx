import {
  ArrowDownToLine,
  ArrowUpRight,
  Code2,
  FileCheck2,
  FileText,
} from "lucide-react";
import { useState } from "react";
import ReactMarkdown from "react-markdown";
import { sampleNote, useWorkbench } from "./data";
import {
  Badge,
  Button,
  download,
  Empty,
  Modal,
  PageHeading,
  Pagination,
  Search,
} from "./ui";
import type { Navigate } from "./WorkbenchApp";
type Props = {
  item?: string;
  navigate: Navigate;
  notify?: (message: string) => void;
};
const initialOutputs = [
  {
    id: "compressor",
    title: "C-104 maintenance summary",
    type: "Markdown",
    description: "Sample equipment summary with source context.",
    content:
      "# C-104 maintenance summary\n\nDEMONSTRATION — sample data only.\n\nThe wet gas centrifugal compressor is linked to the P-204 circuit. Sample vibration is 1.8 mm/s; sample temperature is 54 °C. Review linked equipment records before making an operational decision.\n\nSource: Compressor-C104.md, sample asset register.\n",
    filename: "C-104-maintenance-summary.md",
  },
  {
    id: "vibration",
    title: "P-204 vibration calculation",
    type: "CSV",
    description: "Baseline, current measurement, and calculated change.",
    content:
      "source,baseline_mm_s,current_mm_s,increase_percent\nSample project records,2.8,5.4,92.85714285714286\n",
    filename: "P-204-vibration-calculation.csv",
  },
];
export function DeliverablesView({
  notify,
}: {
  notify: (message: string) => void;
}) {
  const tasks = useWorkbench((s) => s.tasks);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("All formats");
  const [page, setPage] = useState(1);
  const [preview, setPreview] = useState<
    (typeof initialOutputs)[number] | null
  >(null);
  const outputs = [
    ...tasks
      .filter(
        (t) =>
          t.status === "Completed" &&
          t.id !== "task-c104" &&
          t.id !== "task-vibration" &&
          t.sample,
      )
      .map((t) => ({
        id: t.id,
        title: t.title,
        type: "Markdown",
        description: "Sample maintenance note with a recorded demo approval.",
        content: sampleNote,
        filename: `P-204-approval-${t.id.slice(0, 8)}.md`,
      })),
    ...initialOutputs,
  ];
  const filtered = outputs.filter(
    (o) =>
      o.title.toLowerCase().includes(query.toLowerCase()) &&
      (filter === "All formats" || o.type === filter),
  );
  const currentPage = Math.min(
    page,
    Math.max(1, Math.ceil(filtered.length / 6)),
  );
  const save = (output: (typeof initialOutputs)[number]) => {
    try {
      download(
        output.filename,
        output.content,
        output.type === "CSV" ? "text/csv" : "text/markdown",
      );
      notify("Deliverable download started.");
    } catch {
      notify("Download could not start. Try again.");
    }
  };
  return (
    <>
      <PageHeading
        title="Deliverables"
        description="Reviewable files, with the context and evidence that produced them."
      />
      <div className="info-box">
        <FileCheck2 size={18} />
        <span>
          Download real Markdown and CSV sample files. Word, presentation, and
          spreadsheet generation require a document backend.
        </span>
      </div>
      <section className="panel spaced">
        <div className="list-toolbar">
          <Search
            value={query}
            onChange={(v) => {
              setQuery(v);
              setPage(1);
            }}
            placeholder="Search deliverables"
          />
          <label className="select-label">
            Format
            <select
              value={filter}
              onChange={(e) => {
                setFilter(e.target.value);
                setPage(1);
              }}
            >
              {["All formats", "Markdown", "CSV"].map((f) => (
                <option key={f}>{f}</option>
              ))}
            </select>
          </label>
        </div>
        <div className="deliverable-grid">
          {filtered.slice((currentPage - 1) * 6, currentPage * 6).map((o) => (
            <article key={o.id} className="deliverable-card">
              <div className="deliverable-top">
                <span
                  className={`document-icon ${o.type === "CSV" ? "green" : "purple"}`}
                >
                  {o.type === "CSV" ? (
                    <Code2 size={23} />
                  ) : (
                    <FileText size={23} />
                  )}
                </span>
                <Badge>{o.type}</Badge>
              </div>
              <h3>{o.title}</h3>
              <p>{o.description}</p>
              <small>Sample output · Local download</small>
              <div className="form-actions">
                <Button variant="ghost" onClick={() => setPreview(o)}>
                  Preview
                  <ArrowUpRight size={14} />
                </Button>
                <Button onClick={() => save(o)}>
                  <ArrowDownToLine size={15} />
                  Download
                </Button>
              </div>
            </article>
          ))}
        </div>
        {!filtered.length && (
          <Empty
            action={
              <Button
                onClick={() => {
                  setQuery("");
                  setFilter("All formats");
                }}
              >
                Clear filters
              </Button>
            }
          />
        )}
        <Pagination
          page={currentPage}
          total={filtered.length}
          onChange={setPage}
        />
      </section>
      {preview && (
        <Modal title={preview.title} wide onClose={() => setPreview(null)}>
          <article className="markdown-preview">
            {preview.type === "CSV" ? (
              <pre>{preview.content}</pre>
            ) : (
              <ReactMarkdown>{preview.content}</ReactMarkdown>
            )}
          </article>
          <div className="modal-actions">
            <Button onClick={() => save(preview)}>
              <ArrowDownToLine size={16} />
              Download {preview.type}
            </Button>
          </div>
        </Modal>
      )}
    </>
  );
}
