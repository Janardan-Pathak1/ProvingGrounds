import React, { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { toast } from "react-toastify";
import { fetchWithAuth } from '../../utils/api';
import './css/common.css';
import './css/AlertsPage.css'; // Re-using existing CSS

import SuccessMessage from '../../components/SuccessMessage';

/**
 * MainAlerts Component
 * Displays alerts that are not yet taken ownership of by the current user.
 */
function MainAlerts() {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showFilterPopup, setShowFilterPopup] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [expandedRow, setExpandedRow] = useState(null);
  const [details, setDetails] = useState({});
  const [selectedSeverity, setSelectedSeverity] = useState('');
  const [appliedSeverity, setAppliedSeverity] = useState('');

  // NEW: Track users who took ownership of each alert
  const [alertOwners, setAlertOwners] = useState({});

  const FilterPopup = ({ onClose }) => (
    createPortal(
      <div className="filter-popup-overlay">
        <div className="filter-popup-content">
          <h3>Filter Alerts</h3>
          <div className="filter-option-group">
            <label htmlFor="severity-filter">Severity:</label>
            <select
              id="severity-filter"
              value={selectedSeverity}
              onChange={e => setSelectedSeverity(e.target.value)}
              className="filter-select"
            >
              <option value="">All</option>
              <option value="critical">Critical</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>
          <div className="filter-actions">
            <button onClick={handleApplyFilter} className="apply-filter-button">Apply</button>
            <button onClick={onClose} className="close-filter-button">Close</button>
          </div>
        </div>
      </div>,
      document.body
    )
  );

  const toggleExpand = async (eventId) => {
    if (expandedRow === eventId) {
      setExpandedRow(null);
    } else {
      try {
        const response = await fetchWithAuth(`/api/alerts/${eventId}`);
        const data = await response.json();
        setDetails(prev => ({ ...prev, [eventId]: data }));
        setExpandedRow(eventId);
      } catch (err) {
        console.error("Failed to fetch details", err);
      }
    }
  };

  const handleApplyFilter = () => {
    setAppliedSeverity(selectedSeverity);
    setShowFilterPopup(false);
  };

  // Fetch alerts for MAIN channel (unowned alerts)
  const fetchAlerts = useCallback(async () => {
    try {
      setLoading(true);
      let url = '/api/alerts';
      const params = new URLSearchParams();

      if (appliedSeverity) params.append('severity', appliedSeverity);

      if (params.toString()) url += `?${params.toString()}`;

      const res = await fetchWithAuth(url);
      if (!res.ok) throw new Error(`HTTP status ${res.status}`);
      const alertData = await res.json();
      setAlerts(alertData);

      // After alerts are fetched, fetch ownership for each
      alertData.forEach(a => fetchUsersForAlert(a.event_id));
    } catch (err) {
      setError(err.message);
    }
    finally {
      setLoading(false);
    }
  }, [appliedSeverity, setError, setLoading]);

  useEffect(() => {
    fetchAlerts();
  }, [fetchAlerts]);

  // NEW: Fetch all users who took ownership of a specific alert
  const fetchUsersForAlert = async (alertId) => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`/api/alerts/${alertId}/users`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setAlertOwners(prev => ({ ...prev, [alertId]: data }));
      }
    } catch (error) {
      console.error("Error fetching alert owners:", error);
    }
  };

  // UPDATED: Take ownership handler
  const handleTakeOwnership = async (alertId) => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`/api/alerts/${alertId}/start-investigation`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        }
      });

      if (res.ok) {
        toast.success("You have taken ownership of this alert!");
        fetchUsersForAlert(alertId); // Refresh owners list
      } else {
        toast.error("Failed to take ownership.");
      }
    } catch (error) {
      console.error(error);
      toast.error("Server error.");
    }
  };

  if (loading) return <div className="loading-message">Loading...</div>;
  if (error) return <div className="error-message">Error: {error}</div>;

  return (
    <div className="alerts-page-container">
      <h2 className="alerts-title">Main Channel Alerts</h2>
      <div className="table-responsive">
        <table className="data-table">
          <thead>
            <tr>
              <th>
                <button className="filter-button" onClick={() => setShowFilterPopup(true)}>
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="filter-icon">
                    <path fillRule="evenodd" clipRule="evenodd" d="M12 3.75a.75.75 0 0 1 .75.75v4.5a.75.75 0 0 1-1.5 0V4.5a.75.75 0 0 1 .75-.75ZM4.5 8.25a.75.75 0 0 0 0 1.5h15a.75.75 0 0 0 0-1.5h-15ZM12 15.75a.75.75 0 0 1 .75.75v4.5a.75.75 0 0 1-1.5 0v-4.5a.75.75 0 0 1 .75-.75Z" />
                  </svg>
                </button>
              </th>
              <th>Severity</th>
              <th>Date</th>
              <th>Rule Name</th>
              <th>Event ID</th>
              <th>Type</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {alerts.map(alert => (
              <React.Fragment key={alert.event_id}>
                <tr onClick={() => toggleExpand(alert.event_id)}>
                  <td>
                    <button className="expand-toggle-button">
                      {expandedRow === alert.event_id ? (
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                          <path fillRule="evenodd" d="M12.53 16.28a.75.75 0 0 1-1.06 0l-7.5-7.5a.75.75 0 0 1 1.06-1.06L12 14.69l6.97-6.97a.75.75 0 1 1 1.06 1.06l-7.5 7.5Z" clipRule="evenodd" />
                        </svg>
                      ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                          <path fillRule="evenodd" d="M16.28 11.47a.75.75 0 0 1 0 1.06l-7.5 7.5a.75.75 0 0 1-1.06-1.06L14.69 12 7.72 5.03a.75.75 0 0 1 1.06-1.06l7.5 7.5Z" clipRule="evenodd" />
                        </svg>
                      )}
                    </button>
                  </td>
                  <td>{alert.severity_name}</td>
                  <td>{new Date(alert.event_time).toLocaleString()}</td>
                  <td>{alert.rule_name}</td>
                  <td>{alert.event_id}</td>
                  <td>{alert.type_name}</td>
                  <td>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleTakeOwnership(alert.alert_id);
                      }}
                      className="take-ownership-button-styled"
                    >
                      Take Ownership
                    </button>

                    {/* Show list of owners */}
                    {alertOwners[alert.alert_id]?.length > 0 && (
                      <div className="ownership-list">
                        <strong>Owners:</strong>
                        <ul>
                          {alertOwners[alert.alert_id].map(u => (
                            <li key={u.user_id}>{u.username}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </td>
                </tr>
                {expandedRow === alert.event_id && details[alert.event_id] && (
                  <tr className="expanded-details-row">
                    <td colSpan="7">
                      <div className="details-container">
                        <p><strong>EventID :</strong> {details[alert.event_id].event_id}</p>
                        <p><strong>Event Time :</strong> {details[alert.event_id].event_time}</p>
                        <p><strong>Rule :</strong> {details[alert.event_id].rule_name}</p>
                        <p><strong>Level :</strong> {details[alert.event_id].level}</p>
                        <p><strong>Type :</strong> {details[alert.event_id].type}</p>
                        <p><strong>Source IP Address :</strong> {details[alert.event_id].source_ip}</p>
                        <p><strong>Destination IP Address :</strong> {details[alert.event_id].destination_ip}</p>
                        <p><strong>Protocol :</strong> {details[alert.event_id].protocol}</p>
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>

      {showFilterPopup && <FilterPopup onClose={() => setShowFilterPopup(false)} />}
      {showSuccessMessage && (
        <SuccessMessage message={successMessage} onClose={() => setShowSuccessMessage(false)} />
      )}
    </div>
  );
}

export default MainAlerts;
