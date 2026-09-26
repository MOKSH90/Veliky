import { ArrowDownToLine, CheckCheck, Clock3 } from "lucide-react";
import { useState } from "react";
import { date, time, useWorkbench } from "./data";
import {
  Badge,
  Button,
  download,
  Empty,
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
export function ActivityView({
  notify,
}: {
  notify: (message: string) => void;
}) {
  const receipts = useWorkbench((s) => s.receipts);
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const filtered = receipts.filter((r) =>
    (r.title + " " + r.detail).toLowerCase().includes(query.toLowerCase()),
  );
  const currentPage = Math.min(
    page,
    Math.max(1, Math.ceil(filtered.length / 6)),
  );
  return (
    <>
      <PageHeading
        title="Activity log"
        description="A readable record of sample workflow progress and your review decisions."
        action={
          <Button
            onClick={() => {
              try {
                download(
                  "veliky-activity.json",
                  JSON.stringify(
                    {
                      mode: "demo",
                      timezone: "Asia/Kolkata",
                      records: filtered,
                    },
                    null,
                    2,
                  ),
                  "application/json",
                );
                notify("Activity export started.");
              } catch {
                notify("Export could not start. Please try again.");
              }
            }}
          >
            <ArrowDownToLine size={16} />
            Export log
          </Button>
        }
      />
      <div className="info-box">
        <Clock3 size={18} />
        <span>
          Browser-local activity · Times shown in IST. This is a demo receipt
          log, not an immutable server audit trail.
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
            placeholder="Search activity"
          />
          <span className="muted">{filtered.length} events</span>
        </div>
        <div className="activity-list">
          {filtered.slice((currentPage - 1) * 6, currentPage * 6).map((r) => (
            <article key={r.id}>
              <span className="activity-node">
                <CheckCheck size={18} />
              </span>
              <div>
                <h3>{r.title}</h3>
                <p>{r.detail}</p>
                <span className="activity-time">
                  {date(r.at)} · {time(r.at)}
                </span>
              </div>
              <Badge>Demo receipt</Badge>
            </article>
          ))}
        </div>
        {!filtered.length && <Empty />}
        <Pagination
          page={currentPage}
          total={filtered.length}
          onChange={setPage}
        />
      </section>
    </>
  );
}
