import {
  ArrowDownToLine,
  ArrowUpRight,
  FileText,
  LockKeyhole,
  Trash2,
  Upload,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useWorkbench, type LibraryFile } from "./data";
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
export function LibraryView({ item, navigate, notify }: Props) {
  const { files, addFiles, removeFile } = useWorkbench();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All sources");
  const [page, setPage] = useState(1);
  const [uploadError, setUploadError] = useState("");
  const [loading, setLoading] = useState(false);
  const [removal, setRemoval] = useState<LibraryFile | null>(null);
  const picker = useRef<HTMLInputElement>(null);
  const selected = files.find((f) => f.id === item);
  const filtered = files.filter(
    (f) =>
      (f.name + " " + f.category).toLowerCase().includes(query.toLowerCase()) &&
      (category === "All sources" ||
        (category === "Local uploads" ? f.local : f.category === category)),
  );
  const currentPage = Math.min(
    page,
    Math.max(1, Math.ceil(filtered.length / 6)),
  );
  const upload = async (list: FileList | null) => {
    if (!list?.length) return;
    setLoading(true);
    setUploadError("");
    const added: LibraryFile[] = [];
    const errors: string[] = [];
    try {
      for (const file of Array.from(list)) {
        if (file.size > 10 * 1024 * 1024) {
          errors.push(`${file.name}: exceeds the 10 MB limit.`);
          continue;
        }
        if (!/\.(pdf|png|jpe?g|webp|md|txt|csv|docx|xlsx)$/i.test(file.name)) {
          errors.push(`${file.name}: unsupported file type.`);
          continue;
        }
        try {
          const text = /\.(md|txt|csv)$/i.test(file.name)
            ? await file.text()
            : "Text extraction for this file requires a local OCR or document-processing backend. The original file is available for download.";
          added.push({
            id: crypto.randomUUID(),
            name: file.name,
            category: "Local uploads",
            content: text,
            local: true,
            size: file.size,
            file,
          });
        } catch {
          errors.push(
            `${file.name}: could not read this file. Try selecting it again.`,
          );
        }
      }
      addFiles(added);
      if (added.length)
        notify?.(
          `${added.length} file${added.length === 1 ? "" : "s"} added to this tab. Nothing was uploaded to a server.`,
        );
      setUploadError(errors.join(" "));
    } finally {
      setLoading(false);
      if (picker.current) picker.current.value = "";
    }
  };
  return (
    <>
      <PageHeading
        title="Knowledge library"
        description="Your source of context: engineering records, procedures, and local documents."
        action={
          <Button
            variant="primary"
            disabled={loading}
            onClick={() => picker.current?.click()}
          >
            <Upload size={16} />
            {loading ? "Reading files…" : "Add documents"}
          </Button>
        }
      />
      <input
        className="sr-only"
        type="file"
        ref={picker}
        multiple
        accept=".pdf,.png,.jpg,.jpeg,.webp,.md,.txt,.csv,.docx,.xlsx"
        onChange={(e) => void upload(e.target.files)}
        aria-label="Choose local documents"
      />
      <div className="info-box">
        <LockKeyhole size={18} />
        <span>
          Sample records are included. Files you add stay in this tab and are
          cleared on reload. PDF, images, Office files, Markdown, text, and CSV
          · up to 10 MB each.
        </span>
      </div>
      {uploadError && (
        <div className="inline-error" role="alert">
          {uploadError}
        </div>
      )}
      <section className="panel spaced">
        <div className="list-toolbar">
          <Search
            value={query}
            onChange={(v) => {
              setQuery(v);
              setPage(1);
            }}
            placeholder="Search documents"
          />
          <label className="select-label">
            Collection
            <select
              value={category}
              onChange={(e) => {
                setCategory(e.target.value);
                setPage(1);
              }}
            >
              {["All sources", ...new Set(files.map((f) => f.category))].map(
                (c) => (
                  <option key={c}>{c}</option>
                ),
              )}
            </select>
          </label>
        </div>
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th scope="col">Document</th>
                <th scope="col">Collection</th>
                <th scope="col">Source</th>
                <th scope="col">Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered
                .slice((currentPage - 1) * 6, currentPage * 6)
                .map((f) => (
                  <tr key={f.id}>
                    <td>
                      <button
                        className="table-title"
                        onClick={() => navigate("knowledge", f.id)}
                      >
                        <span className="document-icon">
                          <FileText size={19} />
                        </span>
                        <span>
                          {f.name}
                          <small>
                            {f.name.split(".").pop()?.toUpperCase()}{" "}
                            {f.size ? `· ${(f.size / 1024).toFixed(1)} KB` : ""}
                          </small>
                        </span>
                      </button>
                    </td>
                    <td>{f.category}</td>
                    <td>
                      <Badge tone={f.local ? "purple" : ""}>
                        {f.local ? "Local file" : "Sample record"}
                      </Badge>
                    </td>
                    <td>
                      <Button
                        variant="ghost"
                        onClick={() => navigate("knowledge", f.id)}
                      >
                        Preview
                        <ArrowUpRight size={14} />
                      </Button>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
        {!filtered.length && (
          <Empty
            action={
              <Button
                onClick={() => {
                  setQuery("");
                  setCategory("All sources");
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
      {item && (
        <Modal
          title={selected?.name || "Document not found"}
          wide
          onClose={() => navigate("knowledge")}
        >
          {selected ? (
            <>
              <div className="preview-meta">
                <Badge tone={selected.local ? "purple" : ""}>
                  {selected.local
                    ? "Local file · this tab only"
                    : "Sample record"}
                </Badge>
                <span>{selected.category}</span>
              </div>
              <LocalImagePreview file={selected} />
              <article className="markdown-preview">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {selected.content}
                </ReactMarkdown>
              </article>
              <div className="modal-actions">
                {selected.local && (
                  <Button
                    variant="danger"
                    onClick={() => {
                      navigate("knowledge");
                      setRemoval(selected);
                    }}
                  >
                    <Trash2 size={16} />
                    Remove from library
                  </Button>
                )}
                <Button
                  onClick={() => {
                    try {
                      if (selected.file) {
                        const url = URL.createObjectURL(selected.file);
                        const a = document.createElement("a");
                        a.href = url;
                        a.download = selected.name;
                        a.click();
                        setTimeout(() => URL.revokeObjectURL(url), 1000);
                      } else
                        download(
                          selected.name.replace(/\.[^.]+$/, ".md"),
                          selected.content,
                        );
                      notify?.("Document download started.");
                    } catch {
                      notify?.(
                        "Could not start the download. Please try again.",
                      );
                    }
                  }}
                >
                  <ArrowDownToLine size={16} />
                  Download {selected.local ? "original" : "source text"}
                </Button>
              </div>
            </>
          ) : (
            <Empty
              title="Document unavailable"
              description="Local uploads are available only in the tab where you added them."
            />
          )}
        </Modal>
      )}
      {removal && (
        <Modal title="Remove local document?" onClose={() => setRemoval(null)}>
          <p>
            Remove <strong>{removal.name}</strong> from this tab's library? The
            original file on your device will stay untouched.
          </p>
          <div className="modal-actions">
            <Button onClick={() => setRemoval(null)}>Keep document</Button>
            <Button
              variant="danger"
              onClick={() => {
                removeFile(removal.id);
                setRemoval(null);
                notify?.("Document removed from this tab.");
              }}
            >
              Remove document
            </Button>
          </div>
        </Modal>
      )}
    </>
  );
}

function LocalImagePreview({ file }: { file: LibraryFile }) {
  const [url, setUrl] = useState("");
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    setFailed(false);
    if (!file.file || !/\.(png|jpe?g|webp)$/i.test(file.name)) {
      setUrl("");
      return;
    }
    const imageUrl = URL.createObjectURL(file.file);
    setUrl(imageUrl);
    return () => URL.revokeObjectURL(imageUrl);
  }, [file]);
  if (!url) return null;
  return failed ? (
    <p className="inline-error">
      This image could not be decoded. Download the original to inspect it.
    </p>
  ) : (
    <img
      className="local-image-preview"
      src={url}
      alt={`Local document: ${file.name}`}
      onError={() => setFailed(true)}
    />
  );
}
