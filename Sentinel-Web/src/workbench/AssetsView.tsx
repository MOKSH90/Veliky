import { ArrowUpRight, Box, ChevronRight, FileText } from "lucide-react";
import { useState } from "react";
import { INDUSTRIAL_ASSETS } from "../mock/sentinelData";
import { date, useWorkbench } from "./data";
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
export function AssetsView({ item, navigate }: Props) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("All statuses");
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState(false);
  const asset = INDUSTRIAL_ASSETS.find((a) => a.id === item);
  const files = useWorkbench((s) => s.files);
  const filtered = INDUSTRIAL_ASSETS.filter(
    (a) =>
      (a.name + " " + a.unit + " " + a.id)
        .toLowerCase()
        .includes(query.toLowerCase()) &&
      (status === "All statuses" || a.status === status),
  ).sort((a, b) =>
    sort ? b.id.localeCompare(a.id) : a.id.localeCompare(b.id),
  );
  const currentPage = Math.min(
    page,
    Math.max(1, Math.ceil(filtered.length / 6)),
  );
  return (
    <>
      <PageHeading
        title="Asset register"
        description="Equipment context and linked records for better engineering decisions."
      />
      <div className="info-box">
        <Box size={18} />
        <span>
          Reference inventory from the sample project. Measurements are
          historical sample readings, not live sensor data.
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
            placeholder="Search assets or units"
          />
          <label className="select-label">
            Status
            <select
              value={status}
              onChange={(e) => {
                setStatus(e.target.value);
                setPage(1);
              }}
            >
              <option>All statuses</option>
              {[...new Set(INDUSTRIAL_ASSETS.map((a) => a.status))].map((s) => (
                <option key={s} value={s}>
                  {s.replaceAll("_", " ")}
                </option>
              ))}
            </select>
          </label>
        </div>
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th scope="col" aria-sort={sort ? "descending" : "ascending"}>
                  <button onClick={() => setSort(!sort)}>
                    Asset ID {sort ? "↓" : "↑"}
                  </button>
                </th>
                <th scope="col">Equipment</th>
                <th scope="col">Status</th>
                <th scope="col">Last inspection</th>
                <th scope="col">Records</th>
              </tr>
            </thead>
            <tbody>
              {filtered
                .slice((currentPage - 1) * 6, currentPage * 6)
                .map((a) => (
                  <tr key={a.id}>
                    <td>
                      <button
                        className="text-link mono"
                        onClick={() => navigate("assets", a.id)}
                      >
                        {a.id}
                      </button>
                    </td>
                    <td>
                      <button
                        className="table-title"
                        onClick={() => navigate("assets", a.id)}
                      >
                        <span>
                          {a.name}
                          <small>{a.unit}</small>
                        </span>
                      </button>
                    </td>
                    <td>
                      <Status value={a.status} />
                    </td>
                    <td>{date(a.lastInspected)}</td>
                    <td>
                      <Button
                        variant="ghost"
                        onClick={() => navigate("assets", a.id)}
                      >
                        {a.linkedDocuments.length} records
                        <ChevronRight size={14} />
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
                  setStatus("All statuses");
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
          title={asset?.name || "Asset not found"}
          wide
          onClose={() => navigate("assets")}
        >
          {asset ? (
            <>
              <div className="preview-meta">
                <span className="mono">{asset.id}</span>
                <Status value={asset.status} />
                <Badge>{asset.criticality.toLowerCase()} criticality</Badge>
              </div>
              <dl className="fact-grid">
                <div>
                  <dt>Location</dt>
                  <dd>{asset.unit}</dd>
                </div>
                <div>
                  <dt>Category</dt>
                  <dd>{asset.category}</dd>
                </div>
                <div>
                  <dt>Manufacturer</dt>
                  <dd>{asset.manufacturer || "Not recorded"}</dd>
                </div>
                <div>
                  <dt>Last inspected</dt>
                  <dd>{date(asset.lastInspected)}</dd>
                </div>
                <div>
                  <dt>Sample vibration</dt>
                  <dd>
                    {asset.telemetry.rmsVelocity === undefined
                      ? "Not recorded"
                      : `${asset.telemetry.rmsVelocity} mm/s`}
                  </dd>
                </div>
                <div>
                  <dt>Sample temperature</dt>
                  <dd>
                    {asset.telemetry.temperatureC === undefined
                      ? "Not recorded"
                      : `${asset.telemetry.temperatureC} °C`}
                  </dd>
                </div>
              </dl>
              {asset.downstreamHazard && (
                <div className="info-box">{asset.downstreamHazard}</div>
              )}
              <h3 className="subheading">Linked records</h3>
              <div className="source-list">
                {asset.linkedDocuments.map((name) => {
                  const file = files.find((f) => f.name === name);
                  return (
                    <div className="linked-record" key={name}>
                      <FileText size={18} />
                      <span>{name}</span>
                      {file ? (
                        <Button
                          variant="ghost"
                          onClick={() => navigate("knowledge", file.id)}
                        >
                          Open
                          <ArrowUpRight size={14} />
                        </Button>
                      ) : (
                        <Badge>Not in sample library</Badge>
                      )}
                    </div>
                  );
                })}
              </div>
              {asset.telemetry.history.length > 0 && (
                <>
                  <h3 className="subheading">Measurement history</h3>
                  <div className="table-scroll">
                    <table>
                      <thead>
                        <tr>
                          <th>Date</th>
                          <th>Vibration</th>
                          <th>Temperature</th>
                        </tr>
                      </thead>
                      <tbody>
                        {asset.telemetry.history.map((h, i) => (
                          <tr key={i}>
                            <td>{date(h.date)}</td>
                            <td>{h.rmsVelocity} mm/s</td>
                            <td>{h.temperatureC} °C</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
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
