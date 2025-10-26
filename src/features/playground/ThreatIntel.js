import React, { useState } from 'react';
import { fetchWithAuth, fetchFileWithAuth } from '../../utils/api';
import './css/common.css';
import './css/ThreatIntel.css';

/**
 * ThreatIntel Component
 * Provides utilities for searching IP/domain hashes against VirusTotal (mocked)
 * and uploading files for scan (mocked).
 */
function ThreatIntel() {
  const [ipDomain, setIpDomain] = useState('');
  const [file, setFile] = useState(null);
  const [scanResult, setScanResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  /**
   * Handles scanning an IP address or domain.
   * @returns {Promise<void>}
   */
  const handleIpDomainScan = async () => {
    if (!ipDomain) {
      setError('Please enter an IP address or domain.');
      setScanResult(null);
      return;
    }
    setLoading(true);
    setError(null);
    setScanResult(null);

    try {
      const response = await fetchWithAuth(`/api/virustotal/scan?query=${encodeURIComponent(ipDomain)}`);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setScanResult(data);
    } catch (err) {
      console.error('Error during IP/Domain scan:', err);
      setError(err.message || 'An error occurred during scan.');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handles uploading a file for scanning.
   * @param {object} event - The file input change event.
   * @returns {Promise<void>}
   */
  const handleFileUpload = async (event) => {
    const uploadedFile = event.target.files[0];
    if (!uploadedFile) return;

    setFile(uploadedFile);
    setLoading(true);
    setError(null);
    setScanResult(null);

    const formData = new FormData();
    formData.append('file', uploadedFile);

    try {
      const response = await fetchFileWithAuth('/api/virustotal/scan-file', formData);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setScanResult(data);

    } catch (err) {
      console.error('Error during file upload scan:', err);
      setError(err.message || 'An error occurred during file scan.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="threat-intel-container">
      <h2 className="threat-intel-title">Threat Intelligence & File Scan</h2>

      {/* IP/Domain/Hash Scan Section */}
      <div className="threat-intel-section">
        <h3 className="threat-intel-subtitle">Scan IP Address, Domain, or Hash</h3>
        <div className="threat-intel-input-group">
          <input
            type="text"
            placeholder="Enter IP, Domain, or Hash (MD5, SHA1, SHA256)"
            className="threat-intel-input"
            value={ipDomain}
            onChange={(e) => setIpDomain(e.target.value)}
          />
          <button
            onClick={handleIpDomainScan}
            className="threat-intel-button primary-button"
            disabled={loading}
          >
            {loading ? 'Scanning...' : 'Scan'}
          </button>
        </div>
      </div>

      {/* File Upload Scan Section */}
      <div className="threat-intel-section">
        <h3 className="threat-intel-subtitle">Upload File for Scan</h3>
        <p className="threat-intel-info-text">Upload a file to check its reputation with VirusTotal.</p>
        <input
          type="file"
          onChange={handleFileUpload}
          className="threat-intel-file-input"
          disabled={loading}
        />
        {file && <p className="threat-intel-file-info">Selected file: {file.name} ({file.size} bytes)</p>}
      </div>

      {/* Scan Results Display */}
      {loading && <div className="loading-message">Scanning...</div>}
      {error && <div className="error-message">Error: {error}</div>}
      {scanResult && (
        <div className="threat-intel-results">
          <h3 className="threat-intel-subtitle">Scan Results for {scanResult.filename || scanResult.query} ({scanResult.type})</h3>
          {scanResult.filename && <p>Filename: {scanResult.filename}</p>}
          {scanResult.size && <p>Size: {scanResult.size} bytes</p>}
          {scanResult.query && <p>Hash/Query: {scanResult.query}</p>}
          <p>Last Analysis: {scanResult.last_analysis_date}</p>
          <p>Detected by: <span className="detection-count">{scanResult.detected_by}</span> / {scanResult.total_engines} engines</p>

          {Object.keys(scanResult.detections).length > 0 && (
            <div className="detection-details">
              <h4>Detections:</h4>
              <ul>
                {Object.entries(scanResult.detections).map(([engine, detail]) => (
                  <li key={engine}>
                    <strong>{engine}:</strong> {detail.result} (Category: {detail.category})
                  </li>
                ))}
              </ul>
            </div>
          )}
          {scanResult.message && <p className="threat-intel-info-text">{scanResult.message}</p>}
        </div>
      )}
    </div>
  );
}

export default ThreatIntel;
