import React, { useState, useEffect, useCallback } from 'react';
import { fetchWithAuth } from '../../utils/api';
import SuccessMessage from '../../components/SuccessMessage';
import { scenarioQuestions } from './scenarioQuestions';
import './css/common.css';
import './css/CaseManagement.css';

function InvestigationCases() {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState({});
  const [selectedAlert, setSelectedAlert] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [closeReason, setCloseReason] = useState('');
  const [closeResult, setCloseResult] = useState('True Positive');
  const [maliciousEntity, setMaliciousEntity] = useState('');
  const [feedback, setFeedback] = useState('');
  const [isQuestionModalOpen, setIsQuestionModalOpen] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [scenarioAnswers, setScenarioAnswers] = useState([]);
  const [currentScenario, setCurrentScenario] = useState([]);
  const [isDropModalOpen, setIsDropModalOpen] = useState(false);
  const [alertToDrop, setAlertToDrop] = useState(null);
  const [theme] = useState(localStorage.getItem('theme') || 'light');
  const [expandedRow, setExpandedRow] = useState(null);
  const [details, setDetails] = useState({});
  const [successMessage, setSuccessMessage] = useState('');

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

  const fetchInvestigationAlerts = useCallback(async () => {
    try {
      setLoading(true);
      const user = JSON.parse(localStorage.getItem('user'));
      if (!user || !user.user_id) {
        setError('User not logged in or user ID not found.');
        setLoading(false);
        return;
      }
      
      const response = await fetchWithAuth('/api/investigation-alerts');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setAlerts(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const validateAllAnswered = () => {
    return currentScenario.length === scenarioAnswers.length;
  };

  const computeAnswersSummary = () => {
    return scenarioAnswers.map((userAnswer, index) => {
      const question = currentScenario[index];
      const isCorrect = String(userAnswer.answer).trim().toLowerCase() === String(question.correctAnswer).trim().toLowerCase();
      return {
        questionId: index + 1,
        questionText: question.question,
        answer: userAnswer.answer,
        isCorrect,
      };
    });
  };

  const handleCreateCase = async (alertId, answers) => {
    const alertToProcess = alerts.find(a => a.alert_id === alertId);
    if (!alertToProcess) {
      setSuccessMessage('Error: This alert is no longer available for investigation.');
      return;
    }

    setActionLoading(prev => ({ ...prev, [`case_${alertId}`]: true }));
    try {
      const response = await fetchWithAuth(`/api/alerts/${alertId}/create-case`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: `Investigation Case for Alert ${alertId}`,
          description: `Case created from investigation of alert ${alertId}`
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create case');
      }

      const result = await response.json();
      const caseId = result.case.case_id;

      if (answers && answers.length > 0) {
        const answersResponse = await fetchWithAuth(`/api/cases/${caseId}/answers`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ answers })
        });

        if (!answersResponse.ok) {
          const errorData = await answersResponse.json();
          throw new Error(errorData.message || 'Failed to save answers');
        }
      }

      setSuccessMessage(`Case created successfully: ${result.case.case_number}`);
      fetchInvestigationAlerts(); // Refresh alerts after creating a case
    } catch (err) {
      setSuccessMessage(`Error creating case: ${err.message}`);
    } finally {
      setActionLoading(prev => ({ ...prev, [`case_${alertId}`]: false }));
    }
  };

  const handleDropCaseClick = (alert) => {
    setAlertToDrop(alert);
    setIsDropModalOpen(true);
  };

  const handleDropModalClose = () => {
    setIsDropModalOpen(false);
    setAlertToDrop(null);
  };

  const handleConfirmDropCase = async () => {
    if (!alertToDrop) return;

    const { alert_id } = alertToDrop;
    setActionLoading(prev => ({ ...prev, [`drop_${alert_id}`]: true }));
    try {
      const response = await fetchWithAuth(`/api/alerts/${alert_id}/unassign`, {
        method: 'POST',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to drop case');
      }

      handleDropModalClose();
      fetchInvestigationAlerts(); // Refresh the list
    } catch (err) {
      const theme = localStorage.getItem('theme') || 'light';
      const alertElement = document.createElement('div');
      alertElement.className = `custom-alert custom-alert-error custom-alert-${theme}`;
      alertElement.innerText = `Error dropping case: ${err.message}`;
      document.body.appendChild(alertElement);
      setTimeout(() => {
        alertElement.remove();
      }, 3000);
    }
    finally {
      setActionLoading(prev => ({ ...prev, [`drop_${alert_id}`]: false }));
    }
  };

const handleCreateCaseClick = (alert) => {
  // Try to find a scenario key that matches part of the rule_name
  const scenarioKey = Object.keys(scenarioQuestions).find(key =>
    alert.rule_name.toLowerCase().includes(key.toLowerCase())
  );

  const scenario = scenarioKey ? scenarioQuestions[scenarioKey] : null;

  if (scenario) {
    setSelectedAlert(alert);
    setCurrentScenario(scenario);
    setIsQuestionModalOpen(true);
  } else {
    // Fallback if no scenario is found
    handleCreateCase(alert.alert_id);
  }
};

  const handleAnswerQuestion = (answer) => {
    const currentQuestion = currentScenario[currentQuestionIndex];
    const newAnswers = [...scenarioAnswers, { question: currentQuestion.question, answer }];
    setScenarioAnswers(newAnswers);

    if (currentQuestion.branches && currentQuestion.branches[answer]) {
      // Branching question
      setCurrentScenario(currentQuestion.branches[answer]);
      setCurrentQuestionIndex(0);
    } else {
      // Linear question
      const nextQuestionIndex = currentQuestionIndex + 1;
      if (nextQuestionIndex < currentScenario.length) {
        setCurrentQuestionIndex(nextQuestionIndex);
      } else {
        // All questions answered
        setIsQuestionModalOpen(false);
        setCurrentQuestionIndex(0);
        handleCreateCase(selectedAlert.alert_id, newAnswers);
        setScenarioAnswers([]);
      }
    }
  };

  const handleQuestionModalClose = () => {
    setIsQuestionModalOpen(false);
    setCurrentQuestionIndex(0);
    setScenarioAnswers([]);
  };

  const handleCloseAlertClick = (alert) => {
    setSelectedAlert(alert);
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setSelectedAlert(null);
    setCloseReason('');
    setCloseResult('True Positive');
  };

  const handleCloseAlert = async () => {
    if (!selectedAlert) return;

    if (!validateAllAnswered()) {
      setSuccessMessage('Please answer all scenario questions before closing.');
      return;
    }

    const answers = computeAnswersSummary();
    const answers_correct = answers.every(a => a.isCorrect);

    const { alert_id } = selectedAlert;
    setActionLoading(prev => ({ ...prev, [`close_${alert_id}`]: true }));
    try {
      const response = await fetchWithAuth(`/api/alerts/${alert_id}/close-alert`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          reason: closeReason, 
          result: closeResult, 
          malicious_entity: maliciousEntity, 
          feedback,
          answers,
          answers_correct,
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to close alert');
      }

      setSuccessMessage('Alert closed successfully');
      handleModalClose();
      fetchInvestigationAlerts(); // Refresh the list
    } catch (err) {
      setSuccessMessage(`Error closing alert: ${err.message}`);
    } finally {
      setActionLoading(prev => ({ ...prev, [`close_${alert_id}`]: false }));
    }
  };

  useEffect(() => {
    fetchInvestigationAlerts();
  }, [fetchInvestigationAlerts]);

  if (loading) return <div className="loading-message">Loading investigation alerts...</div>;
  if (error) return <div className="error-message">Error: {error}</div>;

  return (
    <div className="case-management-container">
      <h2 className="case-management-title">My Investigation Alerts</h2>

      {successMessage && (
        <SuccessMessage 
          message={successMessage} 
          onClose={() => setSuccessMessage('')} 
        />
      )}

      {alerts.length === 0 ? (
        <div className="no-data-message">
          No alerts under investigation. Start investigating alerts from the Main Channel.
        </div>
      ) : (
        <div className="table-responsive">
          <table className="cases-table">
            <thead>
              <tr>
                <th></th>
                <th>Alert ID</th>
                <th>Rule Name</th>
                <th>Severity</th>
                <th>Source IP</th>
                <th>Destination IP</th>
                <th>Event Time</th>
                <th>Investigation Started</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {alerts.map((alert) => (
                <React.Fragment key={alert.alert_id}>
                  <tr key={alert.alert_id} onClick={() => toggleExpand(alert.event_id)}>
                    <td>
                      <button className="expand-toggle-button">
                        {expandedRow === alert.event_id ? '▼' : '▶'}
                      </button>
                    </td>
                    <td>{alert.event_id}</td>
                    <td>{alert.rule_name}</td>
                    <td>
                      <span className={`severity-badge ${alert.severity_name.toLowerCase()}`}>
                        {alert.severity_name}
                      </span>
                    </td>
                    <td>{alert.source_ip || 'N/A'}</td>
                    <td>{alert.destination_ip || 'N/A'}</td>
                    <td>{new Date(alert.event_time).toLocaleString()}</td>
                    <td>{new Date(alert.investigation_started).toLocaleString()}</td>
                    <td>
                      <div className="action-buttons">
                        <button
                          className="btn btn-primary btn-xs"
                          onClick={(e) => { e.stopPropagation(); handleCreateCaseClick(alert); }}
                          disabled={actionLoading[`case_${alert.alert_id}`]}
                        >
                          {actionLoading[`case_${alert.alert_id}`] ? 'Creating...' : 'Create Case'}
                        </button>
                        <button
                          className="btn btn-xs btn-danger"
                          onClick={(e) => { e.stopPropagation(); handleCloseAlertClick(alert); }}
                          disabled={actionLoading[`close_${alert.alert_id}`]}
                        >
                          {actionLoading[`close_${alert.alert_id}`] ? 'Closing...' : 'Close Alert'}
                        </button>
                        <button
                          className="btn btn-warning btn-xs"
                          onClick={(e) => { e.stopPropagation(); handleDropCaseClick(alert); }}
                          disabled={actionLoading[`drop_${alert.alert_id}`]}
                        >
                          {actionLoading[`drop_${alert.alert_id}`] ? 'Dropping...' : 'Drop Case'}
                        </button>
                      </div>
                    </td>
                  </tr>
                  {expandedRow === alert.event_id && (
                    <tr className="expanded-details-row">
                      <td colSpan="9">
                        <div className="details-container">
                          <p><strong>Event ID:</strong> {details[alert.event_id]?.event_id}</p>
                          <p><strong>Event Time:</strong> {new Date(details[alert.event_id]?.event_time).toLocaleString()}</p>
                          <p><strong>Rule:</strong> {details[alert.event_id]?.rule_name}</p>
                          <p><strong>Level:</strong> {details[alert.event_id]?.level}</p>
                          <p><strong>Type:</strong> {details[alert.event_id]?.type}</p>
                          <p><strong>Source IP:</strong> {details[alert.event_id]?.source_ip}</p>
                          <p><strong>Destination IP:</strong> {details[alert.event_id]?.destination_ip}</p>
                          <p><strong>Protocol:</strong> {details[alert.event_id]?.protocol}</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {isQuestionModalOpen && currentScenario.length > 0 && (
        <div className={`modal-overlay ${theme}-theme`} onClick={handleQuestionModalClose}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Investigate: {selectedAlert.rule_name}</h3>
              <button onClick={handleQuestionModalClose} className="modal-close-button">&times;</button>
            </div>
            <div className="modal-body">
              <p className="question-text">{currentScenario[currentQuestionIndex].question}</p>
              <div className="question-options">
                {currentScenario[currentQuestionIndex].options.map((option) => (
                  <button key={option} onClick={() => handleAnswerQuestion(option)} className="question-option-button">
                    {option}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {isModalOpen && selectedAlert && (
        <div className={`modal-overlay ${theme}-theme`} onClick={handleModalClose}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3 className="modal-title">Close Alert: {selectedAlert.event_id}</h3>
            <div className="modal-body">
              <p><strong>Rule:</strong> {selectedAlert.rule_name}</p>
              <div className="form-group">
                <label htmlFor="closeResult">Result</label>
                <select 
                  id="closeResult" 
                  className="form-control"
                  value={closeResult}
                  onChange={(e) => setCloseResult(e.target.value)}
                >
                  <option value="True Positive">True Positive</option>
                  <option value="False Positive">False Positive</option>
                </select>
              </div>
              <div className="form-group">
                <label htmlFor="closeReason">Closure Reason</label>
                <textarea 
                  id="closeReason" 
                  className="form-control"
                  rows="3"
                  value={closeReason}
                  onChange={(e) => setCloseReason(e.target.value)}
                  placeholder="Explain why you are closing this alert..."
                ></textarea>
              </div>
              <div className="form-group">
                <label htmlFor="maliciousEntity">What do you think is the malicious thing here?</label>
                <input 
                  id="maliciousEntity" 
                  type="text"
                  className="form-control"
                  value={maliciousEntity}
                  onChange={(e) => setMaliciousEntity(e.target.value)}
                  placeholder="e.g., IP address, domain name, file hash"
                />
              </div>
              <div className="form-group">
                <label htmlFor="feedback">Feedback</label>
                <textarea 
                  id="feedback" 
                  className="form-control"
                  rows="3"
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  placeholder="Any feedback on the alert or the investigation process?"
                ></textarea>
              </div>
            </div>
            <div className="modal-footer">
              <button onClick={handleModalClose} className="btn btn-secondary">Cancel</button>
              <button 
                onClick={handleCloseAlert} 
                className="btn btn-primary"
                disabled={actionLoading[`close_${selectedAlert.alert_id}`]}
              >
                {actionLoading[`close_${selectedAlert.alert_id}`] ? 'Closing...' : 'Confirm & Close Alert'}
              </button>
            </div>
          </div>
        </div>
      )}

      {isDropModalOpen && alertToDrop && (
        <div className={`modal-overlay ${theme}-theme`} onClick={handleDropModalClose}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3 className="modal-title">Drop Case: {alertToDrop.event_id}</h3>
            <div className="modal-body">
              <p>Are you sure you want to drop this case and return the alert to the main channel?</p>
            </div>
            <div className="modal-footer">
              <button onClick={handleDropModalClose} className="btn btn-secondary">Cancel</button>
              <button 
                onClick={handleConfirmDropCase} 
                className="btn btn-danger"
                disabled={actionLoading[`drop_${alertToDrop.alert_id}`]}
              >
                {actionLoading[`drop_${alertToDrop.alert_id}`] ? 'Dropping...' : 'Confirm & Drop'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default InvestigationCases;