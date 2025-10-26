import React, { useState, useEffect, useCallback } from 'react';
import { fetchWithAuth } from '../../utils/api';
import './css/common.css';
import './css/CaseManagement.css';

function ClosedCases() {
  const [closedCasesData, setClosedCasesData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchClosedCases = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetchWithAuth('/api/cases?status=closed');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setClosedCasesData(data);
    } catch (err) {
      setError(err.message || 'Failed to load');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchClosedCases();
  }, [fetchClosedCases]);

  const handleReopen = async (e, alertId) => {
    e.stopPropagation(); // Prevent row click event

    try {
      const res = await fetchWithAuth(`/api/cases/${alertId}/reopen`, {
        method: 'PATCH',
      });

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }

      // Refresh the list of closed cases
      setClosedCasesData(prev => prev.filter(c => c.alert_id !== alertId));

    } catch (err) {
      console.error('Error reopening case:', err);
      // Optionally, show an error message to the user
    }
  };

  if (loading) return <div className="loading-message">Loading closed cases...</div>;
  if (error) return <div className="error-message">Error: {error}</div>;

  return (
    <div className="case-management-container">
      <h2 className="case-management-title">Closed Cases</h2>

      <div className="table-responsive">
        <table className="cases-table">
          <thead>
            <tr>
              <th>SEVERITY</th>
              <th>DATE CLOSED</th>
              <th>RULE NAME</th>
              <th>EVENTID</th>
              <th>TYPE</th>
              <th>RESULT</th>
              <th>ACTION</th>
            </tr>
          </thead>

          <tbody>
            {closedCasesData.length === 0 ? (
              <tr>
                <td colSpan="7" className="text-center">No closed cases to display.</td>
              </tr>
            ) : (
              closedCasesData.map((c) => (
                <tr key={c.alert_id}>
                  <td>
                    <span className={`severity-badge ${String(c.severity || '').toLowerCase()}`}>
                      {c.severity || '—'}
                    </span>
                  </td>
                  <td>{c.eventTime ? new Date(c.eventTime).toLocaleString() : '—'}</td>
                  <td className="rule-name-cell">{c.rule_name || '—'}</td>
                  <td>{c.event_id ?? '—'}</td>
                  <td>{c.type || c.alert_type || '—'}</td>
                  <td>
                    {c.user_assessment_correct === true
                      ? 'Correct'
                      : c.user_assessment_correct === false
                        ? 'Incorrect'
                        : '—'}
                  </td>
                  <td>
                    <button
                      className="reopen-btn"
                      onClick={(e) => handleReopen(e, c.alert_id)}
                    >
                      Reopen
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default ClosedCases;