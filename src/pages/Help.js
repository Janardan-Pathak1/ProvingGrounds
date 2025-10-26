import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import './Help.css';

const faqs = [
  {
    question: 'What is Proving Grounds?',
    answer: 'Proving Grounds is a simulated Security Operations Center (SOC) environment designed for cybersecurity professionals and enthusiasts to practice their skills in a realistic setting. It allows you to triage alerts, investigate incidents, and learn the workflow of a SOC analyst.'
  },
  {
    question: 'How do I start an investigation?',
    answer: 'To start an investigation, go to the "Main Channel Alerts" page. From there, you can view unassigned alerts. Click the "Take Ownership" button on an alert to move it to your "My Investigation Alerts" queue and begin your analysis.'
  },
  {
    question: 'What is the difference between "Main Channel Alerts" and "My Investigation Alerts"?',
    answer: '"Main Channel Alerts" are new, unassigned alerts. When you take ownership of an alert, it moves to your "My Investigation Alerts" queue. This is your personal workspace for the alerts you are actively investigating.'
  },
  {
    question: 'How do I use the Log Management feature?',
    answer: 'The Log Management page allows you to search and analyze logs. You can filter logs by various fields like source IP, destination IP, and more. Click on a log entry to see more details, including the raw log message.'
  },
  {
    question: 'What is the Threat Intel page for?',
    answer: 'The Threat Intel page provides tools to enrich your investigations. You can scan IP addresses, domains, and file hashes against threat intelligence databases (like VirusTotal) to determine if they are malicious. You can also upload files to be scanned.'
  },
  {
    question: 'What happens when I close a case?',
    answer: 'When you close a case, you will be asked to provide a reason for closure and classify the alert as a "True Positive" or "False Positive". This information is then moved to the "Closed Cases" section for review.'
  },
  {
    question: 'Can I reopen a closed case?',
    answer: 'Yes, you can reopen a closed case from the "Closed Cases" page. This will move the case back to your investigation queue.'
  },
  {
    question: 'What if I get stuck on a scenario?',
    answer: 'Each investigation scenario may have a set of questions to guide you. If you are still stuck, you can try to use the "Log Management" and "Threat Intel" tools to gather more information. If you are still unable to proceed, you can drop the case and it will be returned to the main channel.'
  }
];

const FAQItem = ({ faq, index }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="faq-item">
      <button className="faq-question" onClick={() => setIsOpen(!isOpen)}>
        <span>{faq.question}</span>
        <span className="faq-icon">{isOpen ? '-' : '+'}</span>
      </button>
      {isOpen && <div className="faq-answer">{faq.answer}</div>}
    </div>
  );
};

function Help() {
  return (
    <div className="help-page-container">
      <h1 className="page-title">Help & Support</h1>

      <section className="help-section">
        <h2 className="section-title">Welcome to Proving Grounds Help</h2>
        <p>
          This platform is designed to provide hands-on training for aspiring and current SOC (Security Operations Center) analysts. Here, you can practice real-world scenarios, analyze logs, manage cases, and enhance your cybersecurity skills.
        </p>
      </section>

      <section className="help-section">
        <h2 className="section-title">Frequently Asked Questions</h2>
        <div className="faq-container">
          {faqs.map((faq, index) => (
            <FAQItem faq={faq} key={index} />
          ))}
        </div>
      </section>

      <section className="help-section">
        <h2 className="section-title">Need More Help?</h2>
        <p>
          If you have further questions or encounter issues not covered here, please feel free to <Link to="/contacts">contact us</Link>.
        </p>
      </section>
    </div>
  );
}

export default Help;