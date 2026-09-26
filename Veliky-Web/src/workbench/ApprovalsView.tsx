import {
  ArrowRight,
  ArrowUpRight,
  Check,
  FileCheck2,
  ShieldCheck,
} from "lucide-react";
import { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import { INCIDENT_CASES } from "../mock/velikyData";
import { sampleNote, useWorkbench } from "./data";
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
export function ApprovalsView({ item, navigate, notify }: Props) {
  const { tasks, changeTask, files } = useWorkbench();
  const [filter, setFilter] = useState("Awaiting review");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [decision, setDecision] = useState<"Completed" | "Declined" | null>(
    null,
  );
  const task = tasks.find((t) => t.id === item);
  const requests = tasks.filter(
    (t) =>
      t.sample &&
      (filter === "All requests"
        ? t.status !== "Draft"
        : t.status === filter) &&
      t.title.toLowerCase().includes(query.toLowerCase()),
  );
  const currentPage = Math.min(
    page,
    Math.max(1, Math.ceil(requests.length / 6)),
  );
  useEffect(() => setDecision(null), [item]);
  return (
    <>
      <PageHeading
        title="Approvals"
        description="See exactly what is proposed. Keep the final decision in human hands."
        action={
          <Badge tone="warning">
            {tasks.filter((t) => t.status === "Awaiting review").length}{" "}
            awaiting review
          </Badge>
        }
      />
      <div className="info-box">
        <ShieldCheck size={19} />
        <span>
          Decisions here update sample records only. No maintenance work order,
          equipment command, message, or purchase is sent.
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
            placeholder="Search approval requests"
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
              {["Awaiting review", "Completed", "Declined", "All requests"].map(
                (s) => (
                  <option key={s}>{s}</option>
                ),
              )}
            </select>
          </label>
        </div>
        {requests.length ? (
          <div className="approval-list">
            {requests.slice((currentPage - 1) * 6, currentPage * 6).map((t) => (
              <div className="approval-row" key={t.id}>
                <span className="document-icon amber">
                  <FileCheck2 size={21} />
                </span>
                <div>
                  <h3>{t.title}</h3>
                  <p>Draft note · Engineering review · Sample request</p>
                </div>
                <Status value={t.status} />
                <Button onClick={() => navigate("approvals", t.id)}>
                  {t.status === "Awaiting review"
                    ? "Review request"
                    : "View record"}
                  <ArrowRight size={15} />
                </Button>
              </div>
            ))}
          </div>
        ) : (
          <Empty
            title={
              filter === "Awaiting review" && !query
                ? "No pending approvals"
                : "No matching requests"
            }
            description="Try a different filter, or run the P-204 sample in AI workspace."
            action={
              <Button onClick={() => navigate("workspace")}>
                Open AI workspace
              </Button>
            }
          />
        )}
        <Pagination
          page={currentPage}
          total={requests.length}
          onChange={setPage}
        />
      </section>
      {item && (
        <Modal
          title={task ? "Review approval note" : "Request not found"}
          wide
          onClose={() => navigate("approvals")}
        >
          {task ? (
            <>
              <div className="preview-meta">
                <Status value={task.status} />
                <Badge>Sample request</Badge>
              </div>
              <h3>{task.title}</h3>
              <dl className="fact-grid">
                <div>
                  <dt>Proposed action</dt>
                  <dd>Record approval of the sample maintenance note</dd>
                </div>
                <div>
                  <dt>Scope</dt>
                  <dd>This task only · browser demo record</dd>
                </div>
                <div>
                  <dt>Proposed by</dt>
                  <dd>Veliky sample workflow</dd>
                </div>
                <div>
                  <dt>External effect</dt>
                  <dd>None. No work order dispatched.</dd>
                </div>
              </dl>
              <details className="evidence-details" open>
                <summary>Review the exact note</summary>
                <article className="markdown-preview">
                  <ReactMarkdown>{sampleNote}</ReactMarkdown>
                </article>
              </details>
              <details className="evidence-details">
                <summary>Source evidence · 3 sample records</summary>
                {INCIDENT_CASES[0].evidence.map((e) => (
                  <div className="evidence-excerpt" key={e.title}>
                    <strong>{e.title}</strong>
                    <p>{e.excerpt}</p>
                    <Button
                      variant="ghost"
                      onClick={() =>
                        navigate(
                          "knowledge",
                          files.find((f) => f.name === e.documentName)?.id,
                        )
                      }
                    >
                      Open source
                      <ArrowUpRight size={13} />
                    </Button>
                  </div>
                ))}
              </details>
              {task.status === "Awaiting review" && (
                <div
                  className="decision-box"
                  role="group"
                  aria-label="Review decision"
                >
                  {decision ? (
                    <>
                      <p>
                        {decision === "Completed"
                          ? "Record your approval for this sample note? The decision will appear in Activity log."
                          : "Decline this sample request? No external action will be taken."}
                      </p>
                      <div className="modal-actions">
                        <Button onClick={() => setDecision(null)}>
                          Back to review
                        </Button>
                        <Button
                          variant={
                            decision === "Completed" ? "primary" : "danger"
                          }
                          onClick={() => {
                            changeTask(task.id, decision);
                            setDecision(null);
                            navigate("approvals");
                            notify?.(
                              decision === "Completed"
                                ? "Demo approval recorded. The sample note is available in Deliverables."
                                : "Demo request declined. No external action was taken.",
                            );
                          }}
                        >
                          {decision === "Completed"
                            ? "Record demo approval"
                            : "Decline demo request"}
                        </Button>
                      </div>
                    </>
                  ) : (
                    <div className="modal-actions">
                      <Button onClick={() => setDecision("Declined")}>
                        Decline request
                      </Button>
                      <Button
                        variant="primary"
                        onClick={() => setDecision("Completed")}
                      >
                        <Check size={16} />
                        Approve sample note
                      </Button>
                    </div>
                  )}
                </div>
              )}
              {task.status !== "Awaiting review" && (
                <p className="info-box">
                  This request is {task.status.toLowerCase()}. Its receipt is
                  available in the Activity log.
                </p>
              )}
            </>
          ) : (
            <Empty />
          )}
        </Modal>
      )}
    </>
  );
}
