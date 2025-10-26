import React from 'react';
import { createPortal } from 'react-dom';
import './SuccessMessage.css';

const SuccessMessage = ({ message, onClose }) => {
  return createPortal(
    <div className="success-message-overlay">
      <div className="success-message-content">
        <div className="success-icon">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
            <path fillRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12Zm13.36-1.814a.75.75 0 1 0-1.22-1.09L10.5 11.47l-1.952-1.952a.75.75 0 0 0-1.06 1.06l2.5 2.5a.75.75 0 0 0 1.06 0l3.5-3.5Z" clipRule="evenodd" />
          </svg>
        </div>
        <p>{message}</p>
        <button onClick={onClose} className="success-close-button">Close</button>
      </div>
    </div>,
    document.body
  );
};

export default SuccessMessage;