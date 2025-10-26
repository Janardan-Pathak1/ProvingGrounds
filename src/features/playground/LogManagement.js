import React, { useEffect, useState, useCallback } from "react";
import { fetchWithAuth } from "../../utils/api";
import './css/common.css';
import './css/LogManagement.css'; // Re-using existing CSS

const FIELDS = [
  { value: "source_ip", label: "Source Address" },
  { value: "destination_ip", label: "Destination Address" },
  { value: "log_source", label: "Protocol / Source" },
  { value: "event_id", label: "Event ID" },
  { value: "raw_log", label: "Raw Log" }
];

const OPERATORS = [
  { value: "contains", label: "contains" },
  { value: "equals", label: "equals" },
  { value: "startswith", label: "starts with" },
  { value: "endswith", label: "ends with" }
];

export default function LogManagement() {
  const [logs, setLogs] = useState([]);
  const [expandedRow, setExpandedRow] = useState(null);
  const [details, setDetails] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // filter / pagination state
  const [field, setField] = useState(FIELDS[0].value);
  const [op, setOp] = useState(OPERATORS[0].value);
  const [value, setValue] = useState("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10); // default rows per page
  const [total, setTotal] = useState(0);

  const fetchLogs = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (field) params.append("field", field);
      if (op) params.append("op", op);
      if (value) params.append("value", value);
      params.append("page", page);
      params.append("limit", limit);

      const url = `/api/logs?${params.toString()}`;
      const res = await fetchWithAuth(url);
      if (!res.ok) {
        const text = await res.text();
        throw new Error(`HTTP ${res.status} - ${text}`);
      }
      const payload = await res.json();
      // payload should be { rows: [...], total: <number> }
      setLogs(payload.rows || []);
      setTotal(Number(payload.total || 0));
    } catch (err) {
      setError(err.message);
      setLogs([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [field, op, value, page, limit]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const toggleExpand = async (logId) => {
    if (expandedRow === logId) {
      setExpandedRow(null);
    } else {
      if (!details[logId]) {
        try {
          const res = await fetchWithAuth(`/api/logs/${logId}`);
          if (!res.ok) {
            throw new Error(`HTTP ${res.status}`);
          }
          const data = await res.json();
          setDetails((prev) => ({ ...prev, [logId]: data }));
        } catch (err) {
          console.error("Failed to fetch details", err);
        }
      }
      setExpandedRow(logId);
    }
  };

  const handleSearch = () => {
    setPage(1); // reset to first page whenever searching
    fetchLogs();
  };

  const totalPages = Math.max(1, Math.ceil(total / limit));
  const pageNumbers = [];
  // build a small range of pages for UI (you can expand logic)
  const start = Math.max(1, page - 2);
  const end = Math.min(totalPages, page + 2);
  for (let i = start; i <= end; i++) pageNumbers.push(i);

  return (
    <div className="alerts-page-container">
      <h2 className="alerts-title">Log Management</h2>

      <div className="search-container filter-row">
        <div className="filter-field">
          <label>Columns</label>
          <select value={field} onChange={(e) => setField(e.target.value)}>
            {FIELDS.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
          </select>
        </div>

        <div className="filter-op">
          <label>Operator</label>
          <select value={op} onChange={(e) => setOp(e.target.value)}>
            {OPERATORS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>

        <div className="filter-value">
          <label>Value</label>
          <input
            type="text"
            placeholder="Enter search value..."
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
          />
        </div>

        <div className="filter-actions">
          <button className="search-button" onClick={() => handleSearch()}>Search</button>
          <button className="clear-button" onClick={() => { setValue(''); setField(FIELDS[0].value); setOp(OPERATORS[0].value); setPage(1); fetchLogs(); }}>Clear</button>
        </div>

        <div className="page-size">
          <label>Rows</label>
          <select value={limit} onChange={(e) => { setLimit(Number(e.target.value)); setPage(1); }}>
            <option value={5}>5</option>
            <option value={10}>10</option>
            <option value={25}>25</option>
          </select>
        </div>
      </div>

      {loading ? <div className="loading-message">Loading...</div> :
        error ? <div className="error-message">Error: {error}</div> :
        <>
          <div className="table-responsive">
            <table className="data-table log-management-table">
              <thead>
                <tr>
                  <th></th>
                  <th>Event Time</th>
                  <th>Source IP</th>
                  <th>Destination IP</th>
                  <th>Protocol</th>
                  <th>Event ID</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <React.Fragment key={log.log_id}>
                    <tr className="data-row" onClick={() => toggleExpand(log.log_id)}>
                      <td>
                        <button className="expand-toggle-button" aria-label="expand">
                          {expandedRow === log.log_id ? "▾" : "▸"}
                        </button>
                      </td>
                      <td>{log.log_time ? new Date(log.log_time).toLocaleString() : '-'}</td>
                      <td>{log.source_ip || '-'}</td>
                      <td>{log.destination_ip || '-'}</td>
                      <td>{log.log_source || '-'}</td>
                      <td>{log.event_id || '-'}</td>
                    </tr>

                    {expandedRow === log.log_id && details[log.log_id] && (
                      <tr className="expanded-details-row">
                        <td colSpan="6">
                          <div className="details-container">
                            <div className="details-columns">
                              <div className="details-left">
                                <div><strong>Log ID:</strong> {details[log.log_id].log_id}</div>
                                <div><strong>Source Address:</strong> {details[log.log_id].source_ip}</div>
                                <div><strong>Source Port:</strong> {details[log.log_id].source_port}</div>
                                <div><strong>Destination Address:</strong> {details[log.log_id]?.destination_ip}</div>
                              </div>
                              <div className="details-right">
                                <div><strong>Destination Port:</strong> {details[log.log_id].destination_port}</div>
                                <div><strong>Protocol:</strong> {details[log.log_id].log_source}</div>
                                <div><strong>Time:</strong> {details[log.log_id].log_time ? new Date(details[log.log_id].log_time).toLocaleString() : ''}</div>
                              </div>
                            </div>

                            <div className="raw-log">
                              <h4>Raw Log</h4>
                              <pre>{details[log.log_id].raw_log}</pre>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
                {logs.length === 0 && (
                  <tr><td colSpan="6">No logs found.</td></tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="pagination-row">
            <div className="rows-info">Showing {logs.length} of {total} events</div>
            <div className="pager">
              <button className="pager-btn" disabled={page <= 1} onClick={() => setPage(p => Math.max(1, p - 1))}>‹</button>
              {start > 1 && <button className="pager-btn" onClick={() => setPage(1)}>1</button>}
              {start > 2 && <span className="pager-ellipsis">…</span>}
              {pageNumbers.map(n => (
                <button
                  key={n}
                  className={`pager-btn ${n === page ? 'active' : ''}`}
                  onClick={() => setPage(n)}
                >{n}</button>
              ))}
              {end < totalPages - 1 && <span className="pager-ellipsis">…</span>}
              {end < totalPages && <button className="pager-btn" onClick={() => setPage(totalPages)}>{totalPages}</button>}
              <button className="pager-btn" disabled={page >= totalPages} onClick={() => setPage(p => Math.min(totalPages, p + 1))}>›</button>
            </div>
          </div>
        </>
      }
    </div>
  );
}
