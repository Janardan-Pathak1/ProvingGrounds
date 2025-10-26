export const scenarioQuestions = {
  "Phishing Alert": [
    {
      question: "Was the email flagged due to a suspicious domain or a malicious attachment?",
      options: ["Suspicious Domain", "Malicious Attachment"],
      correctAnswer: "Malicious Attachment",
      branches: {
        "Suspicious Domain": [
          {
            question: "Do the logs show multiple emails sent from the same domain within a short time?",
            options: ["Yes", "No"],
            correctAnswer: "Yes"
          },
          {
            question: "Were the recipient accounts high-value (e.g., admins, finance)?",
            options: ["Yes", "No"],
            correctAnswer: "Yes"
          },
          {
            question: "Did users who received the email attempt to log in from new IP addresses afterward?",
            options: ["Yes", "No"],
            correctAnswer: "Yes"
          }
        ],
        "Malicious Attachment": [
          {
            question: "Did the logs capture users opening or downloading the attachment?",
            options: ["Yes", "No"],
            correctAnswer: "Yes"
          },
          {
            question: "Was the attachment type flagged before (e.g., .exe, .docm)?",
            options: ["Yes", "No"],
            correctAnswer: "Yes"
          },
          {
            question: "Did the endpoint logs show execution of suspicious processes after download?",
            options: ["Yes", "No"],
            correctAnswer: "Yes"
          }
        ]
      }
    }
  ],
  "SQL Injection": [
    {
      question: "Was the injection attempt detected via error messages or unusual query patterns?",
      options: ["Error Messages", "Unusual Queries"],
      correctAnswer: "Unusual Queries",
      branches: {
        "Error Messages": [
          {
            question: "Which error type was logged (syntax error, permission denied, timeout)?",
            options: ["Syntax Error", "Permission Denied", "Timeout"],
            correctAnswer: "Syntax Error"
          },
          {
            question: "Did the error reference a sensitive table (e.g., users, credentials)?",
            options: ["Yes", "No"],
            correctAnswer: "Yes"
          },
          {
            question: "Was the same source IP generating repeated SQL errors in the logs?",
            options: ["Yes", "No"],
            correctAnswer: "Yes"
          }
        ],
        "Unusual Queries": [
          {
            question: "Did the query contain suspicious keywords (UNION, SELECT, DROP)?",
            options: ["Yes", "No"],
            correctAnswer: "Yes"
          },
          {
            question: "Was the query executed outside of normal business hours?",
            options: ["Yes", "No"],
            correctAnswer: "Yes"
          },
          {
            question: "Did the query size or structure differ significantly from normal requests?",
            options: ["Yes", "No"],
            correctAnswer: "Yes"
          }
        ]
      }
    }
  ],
  "RDP Brute Force": [
    {
      question: "Were the login attempts originating from internal or external IP addresses?",
      options: ["Internal", "External"],
      correctAnswer: "External",
      branches: {
        "Internal": [
          {
            question: "Was the source host identified in the logs as a server or workstation?",
            options: ["Server", "Workstation"],
            correctAnswer: "Workstation"
          },
          {
            question: "Were multiple user accounts targeted from the same source host?",
            options: ["Yes", "No"],
            correctAnswer: "Yes"
          },
          {
            question: "Did any of the targeted accounts eventually authenticate successfully?",
            options: ["Yes", "No"],
            correctAnswer: "Yes"
          }
        ],
        "External": [
          {
            question: "How many failed login attempts were logged from the source IP in 24h?",
            options: ["1-10", "11-100", "101+"],
            correctAnswer: "101+"
          },
          {
            question: "Did the brute force attempts target privileged accounts?",
            options: ["Yes", "No"],
            correctAnswer: "Yes"
          },
          {
            question: "Was the source IP linked to other malicious activity in logs?",
            options: ["Yes", "No"],
            correctAnswer: "Yes"
          }
        ]
      }
    }
  ],
  "Forced Authentication": [
    {
      question: "Which protocol was targeted in the forced authentication attempt?",
      options: ["SMB", "LDAP", "HTTP"],
      correctAnswer: "SMB",
      branches: {
        "SMB": [
          {
            question: "Did the logs show multiple failed attempts against shared resources?",
            options: ["Yes", "No"],
            correctAnswer: "Yes"
          },
          {
            question: "Were the attempts coming from a single workstation or multiple sources?",
            options: ["Single", "Multiple"],
            correctAnswer: "Single"
          },
          {
            question: "Did any accounts lock due to repeated failures?",
            options: ["Yes", "No"],
            correctAnswer: "Yes"
          }
        ],
        "LDAP": [
          {
            question: "Were the attempts made with valid but expired credentials?",
            options: ["Yes", "No"],
            correctAnswer: "Yes"
          },
          {
            question: "Did the requests originate from a service account or user account?",
            options: ["Service Account", "User Account"],
            correctAnswer: "User Account"
          },
          {
            question: "Were there concurrent authentication attempts from the same IP?",
            options: ["Yes", "No"],
            correctAnswer: "Yes"
          }
        ],
        "HTTP": [
          {
            question: "Was the authentication attempt directed at a web-facing application?",
            options: ["Yes", "No"],
            correctAnswer: "Yes"
          },
          {
            question: "Did the logs show repeated authentication failures for the same account?",
            options: ["Yes", "No"],
            correctAnswer: "Yes"
          },
          {
            question: "Were different user accounts targeted from the same IP?",
            options: ["Yes", "No"],
            correctAnswer: "Yes"
          }
        ]
      }
    }
  ]
};
