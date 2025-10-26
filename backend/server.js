const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
const axios = require('axios'); // Import axios for making HTTP requests
const multer = require('multer'); // For handling file uploads
const crypto = require('crypto'); // For calculating file hashes
const bcrypt = require('bcrypt'); // For password hashing
const jwt = require('jsonwebtoken'); // For JWT generation and verification
// const nodemailer = require('nodemailer'); // For sending emails - REMOVED
require('dotenv').config(); // Load environment variables from .env file

const app = express();
const port = process.env.PORT || 5000; // Use port from .env or default to 5000

// Middleware
app.use(express.json()); // Parses incoming JSON requests
app.use(cors()); // Enables Cross-Origin Resource Sharing for all routes

// Configure multer for file uploads
const upload = multer({ storage: multer.memoryStorage() });

// Nodemailer transporter setup - REMOVED
// const transporter = nodemailer.createTransport({
//     service: 'Gmail', // You can use other services like SendGrid, Mailgun, etc.
//     auth: {
//         user: process.env.EMAIL_USER, // Your email address
//         pass: process.env.EMAIL_PASS, // Your email password or app-specific password
//     },
// });

// Middleware to authenticate JWT
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (token == null) return res.sendStatus(401); // No token provided

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.sendStatus(403); // Token is invalid or expired
    req.user = user; // Attach user payload to request
    req.user.id = user.user_id; // For backward compatibility with existing code using req.user.id
    next(); // Proceed to the next middleware/route handler
  });
}

// PostgreSQL connection pool configuration
const pool = new Pool({
  user: process.env.PGUSER,
  host: process.env.PGHOST,
  database: process.env.PGDATABASE,
  password: process.env.PGPASSWORD,
  port: process.env.PGPORT,
});

// Test database connection on startup
pool.connect((err, client, release) => {
  if (err) {
    return console.error('Error acquiring client', err.stack);
  }
  client.query('SELECT NOW()', (err, result) => {
    release(); // Release the client back to the pool
    if (err) {
      return console.error('Error executing query', err.stack);
    }
    console.log('Database connected at:', result.rows[0].now);
  });
});

/**
 * @route POST /register
 * @description Handles user registration.
 * Expects username, password, and an optional email in the request body.
 */
app.post('/register', async (req, res) => {
  const { username, password, email } = req.body;

  // Basic validation: ensure username and password are provided
  if (!username || !password) {
    return res.status(400).json({ message: 'Username and password are required.' });
  }

  try {
    // Check if username already exists and is not soft-deleted to prevent duplicates
    const existingUser = await pool.query('SELECT user_id FROM users WHERE username = $1 AND deleted_at IS NULL', [username]);
    if (existingUser.rows.length > 0) {
      return res.status(409).json({ message: 'Username already exists.' });
    }

    // Hash the password before storing
    const saltRounds = 10; // Cost factor for hashing
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Insert new user into the database.
    const result = await pool.query(
      'INSERT INTO users (username, password_hash, email) VALUES ($1, $2, $3) RETURNING user_id, username',
      [username, hashedPassword, email || null] // Store the hashed password
    );
    res.status(201).json({ message: 'User registered successfully! Redirecting to login...', redirectTo: '/login' });
  } catch (error) {
    console.error('Error during registration:', error.message);
    res.status(500).json({ message: 'Internal server error.' });
  }
});

/**
 * @route POST /login
 * @description Handles user login.
 * Expects username and password in the request body.
 */
app.post('/login', async (req, res) => {
  const { username, password } = req.body;

  // Basic validation: ensure username and password are provided
  if (!username || !password) {
    return res.status(400).json({ message: 'Username and password are required.' });
  }

  try {
    // Retrieve the user from the database, ensuring account is not soft-deleted
    const userResult = await pool.query('SELECT user_id, username, password_hash, deleted_at FROM users WHERE username = $1 AND deleted_at IS NULL', [username]);

    if (userResult.rows.length === 0) {
      return res.status(401).json({ message: 'Invalid username or password.' });
    }

    const user = userResult.rows[0];

    // Compare the provided password with the stored hashed password
    const isMatch = await bcrypt.compare(password, user.password_hash);

    if (isMatch) {
      // Generate JWT using user_id
      const accessToken = jwt.sign({ user_id: user.user_id, username: user.username }, process.env.JWT_SECRET, { expiresIn: '1h' }); // Token expires in 1 hour

      // If a user is found and password matches, login is successful
      res.status(200).json({ message: 'Login successful!', token: accessToken, user: { user_id: user.user_id, username: user.username } });
    } else {
      // If password does not match
      res.status(401).json({ message: 'Invalid username or password.' });
    }
  } catch (error) {
    console.error('Error during login:', error.message);
    res.status(500).json({ message: 'Internal server error.' });
  }
});

/**
 * @route POST /api/check-username
 * @description Checks if a username exists in the database.
 * Expects username in the request body.
 */
app.post('/api/check-username', async (req, res) => {
  const { username } = req.body;

  if (!username) {
    return res.status(400).json({ message: 'Username is required.' });
  }

  try {
    const userResult = await pool.query('SELECT user_id FROM users WHERE username = $1 AND deleted_at IS NULL', [username]);

    if (userResult.rows.length === 0) {
      return res.status(404).json({ message: 'User not found.' });
    }

    res.status(200).json({ message: 'User found.' });

  } catch (error) {
    console.error('Error checking username:', error.message);
    res.status(500).json({ message: 'Internal server error.' });
  }
});

/**
 * @route POST /api/forgot-password
 * @description Resets the user's password via username.
 * Expects username, newPassword, and confirmNewPassword in the request body.
 */
app.post('/api/forgot-password', async (req, res) => {
  const { username, newPassword, confirmNewPassword } = req.body;

  if (!username || !newPassword || !confirmNewPassword) {
    return res.status(400).json({ message: 'Username, new password, and confirm password are required.' });
  }

  if (newPassword !== confirmNewPassword) {
    return res.status(400).json({ message: 'New password and confirm password do not match.' });
  }

  try {
    const userResult = await pool.query('SELECT user_id FROM users WHERE username = $1 AND deleted_at IS NULL', [username]);

    if (userResult.rows.length === 0) {
      return res.status(404).json({ message: 'User not found.' });
    }

    const user = userResult.rows[0];

    // Hash the new password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

    // Update the user's password
    await pool.query(
      'UPDATE users SET password_hash = $1 WHERE user_id = $2',
      [hashedPassword, user.user_id]
    );

    res.status(200).json({ message: 'Password has been reset successfully.' });

  } catch (error) {
    console.error('Error during password reset:', error.message);
    res.status(500).json({ message: 'Internal server error.' });
  }
});

/**
 * @route POST /api/change-password
 * @description Allows a logged-in user to change their password.
 * Expects currentPassword, newPassword, and confirmNewPassword in the request body.
 */
app.post('/api/change-password', authenticateToken, async (req, res) => {
  const { currentPassword, newPassword, confirmNewPassword } = req.body;
  const userId = req.user.user_id; // Get user ID from authenticated token

  if (!currentPassword || !newPassword || !confirmNewPassword) {
    return res.status(400).json({ message: 'All password fields are required.' });
  }

  if (newPassword !== confirmNewPassword) {
    return res.status(400).json({ message: 'New password and confirm password do not match.' });
  }

  try {
    // Retrieve the user's current hashed password from the database, ensuring account is not soft-deleted
    const userResult = await pool.query('SELECT password_hash FROM users WHERE user_id = $1 AND deleted_at IS NULL', [userId]);

    if (userResult.rows.length === 0) {
      return res.status(404).json({ message: 'User not found.' });
    }

    const user = userResult.rows[0];

    // Compare the provided current password with the stored hashed password
    const isMatch = await bcrypt.compare(currentPassword, user.password_hash);

    if (!isMatch) {
      return res.status(401).json({ message: 'Incorrect current password.' });
    }

    // Hash the new password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

    // Update the user's password
    await pool.query(
      'UPDATE users SET password_hash = $1 WHERE user_id = $2',
      [hashedPassword, userId]
    );

    res.status(200).json({ message: 'Password changed successfully.' });

  } catch (error) {
    console.error('Error changing password:', error.message);
    res.status(500).json({ message: 'Internal server error.' });
  }
});

/**
 * @route POST /api/update-email
 * @description Allows a logged-in user to update their email address.
 * Expects email in the request body.
 */
app.post('/api/update-email', authenticateToken, async (req, res) => {
  const { email } = req.body;
  const userId = req.user.user_id; // Get user ID from authenticated token

  if (!email) {
    return res.status(400).json({ message: 'Email is required.' });
  }

  try {
    // Optional: Validate email format here if needed

    // Update the user's email
    await pool.query(
      'UPDATE users SET email = $1 WHERE user_id = $2',
      [email, userId]
    );

    res.status(200).json({ message: 'Email updated successfully.' });

  } catch (error) {
    console.error('Error updating email:', error.message);
    res.status(500).json({ message: 'Internal server error.' });
  }
});

/**
 * @route POST /api/virustotal/scan-file
 * @description Receives a file, calculates its MD5 hash, and scans it using the VirusTotal API.
 * Expects a file in the request body.
 */
app.post('/api/virustotal/scan-file', authenticateToken, upload.single('file'), async (req, res) => {
  const VIRUSTOTAL_API_KEY = process.env.VIRUSTOTAL_API_KEY;

  if (!req.file) {
    return res.status(400).json({ message: 'No file uploaded.' });
  }

  if (!VIRUSTOTAL_API_KEY) {
    return res.status(500).json({ message: 'VirusTotal API key not configured in environment variables.' });
  }

  try {
    // Calculate MD5 hash of the uploaded file
    const hash = crypto.createHash('md5').update(req.file.buffer).digest('hex');
    const query = hash; // Use the hash as the query for VirusTotal

    const url = `https://www.virustotal.com/api/v3/files/${query}`;
    const type = 'file';

    const response = await axios.get(url, {
      headers: {
        'x-apikey': VIRUSTOTAL_API_KEY,
        'Accept': 'application/json',
      },
    });

    const data = response.data;

    // Process the VirusTotal response to extract relevant information
    const attributes = data.data.attributes;
    const analysisResults = attributes.last_analysis_results;
    let detected = 0;
    const detections = {};

    for (const engine in analysisResults) {
      if (analysisResults[engine].category === 'malicious') {
        detected++;
        detections[engine] = {
          category: analysisResults[engine].category,
          result: analysisResults[engine].result,
          method: analysisResults[engine].method,
        };
      }
    }

    res.status(200).json({
      query: query,
      type: type,
      filename: req.file.originalname,
      size: req.file.size,
      total_engines: Object.keys(analysisResults).length,
      detected_by: detected,
      detections: detections,
      last_analysis_date: new Date(attributes.last_analysis_date * 1000).toLocaleString(),
    });

  } catch (error) {
    console.error('Error calling VirusTotal API for file scan:', error);
    // Handle 404 specifically for files not found in VirusTotal
    if (error.response && error.response.status === 404) {
      return res.status(404).json({ message: 'File not found in VirusTotal database.', query: req.file.originalname });
    }
    res.status(500).json({ message: 'Internal server error during file scan.', error: error.message });
  }
});

/**
 * @route GET /api/alerts
 * @description Fetches all alerts for main channel (no filtering by user)
 */
app.get('/api/alerts', authenticateToken, async (req, res) => {
  const { severity, status, filter } = req.query;
  const userId = req.user.user_id;
  
let query = `
  SELECT
    a.*,
    sl.severity_name,
    at.type_name
  FROM alerts a
  JOIN severity_levels sl ON a.severity_id = sl.severity_id
  LEFT JOIN alert_types at ON a.alert_type_id = at.type_id
  WHERE a.is_closed = FALSE
    AND a.alert_id NOT IN (
      SELECT alert_id
      FROM alert_investigations
      WHERE user_id = $1 AND is_active = TRUE
    )
`;


  
  const queryParams = [userId];
  const conditions = [];
  let paramIndex = 2;

  if (severity) {
    conditions.push(`LOWER(sl.severity_name) = $${paramIndex}`);
queryParams.push(severity.toLowerCase());
    paramIndex++;
  }
  if (status) {
    conditions.push(`LOWER(a.status) = $${paramIndex}`);
    queryParams.push(status.toLowerCase());
    paramIndex++;
  }
  if (filter) {
    conditions.push(`(LOWER(CAST(a.event_id AS TEXT)) LIKE $${paramIndex} OR LOWER(a.raw_message) LIKE $${paramIndex})`);
queryParams.push(`%${filter.toLowerCase()}%`);

    paramIndex++;
  }

  if (conditions.length > 0) {
    query += ' AND ' + conditions.join(' AND ');
  }

  query += ' ORDER BY a.event_time DESC';

  try {
    const result = await pool.query(query, queryParams);
    res.status(200).json(result.rows);
  } catch (error) {
    console.error('Error fetching alerts:', error.message);
    res.status(500).json({ message: 'Internal server error.' });
  }
});

/**
 * @route GET /api/investigation-alerts
 * @description Fetches alerts that the current user is investigating
 */
app.get('/api/investigation-alerts', authenticateToken, async (req, res) => {
  const userId = req.user.user_id;
  const { severity, status, filter } = req.query;

let query = `
  SELECT DISTINCT
    a.*,
    sl.severity_name,
    ai.investigation_id,
    ai.started_at AS investigation_started,
    ai.notes AS investigation_notes
FROM alerts a
JOIN severity_levels sl ON a.severity_id = sl.severity_id
JOIN alert_investigations ai ON a.alert_id = ai.alert_id 
WHERE ai.user_id = $1 AND ai.is_active = TRUE AND a.is_closed = FALSE

  `;
  
  const queryParams = [userId];
  let paramIndex = 2;

if (severity) {
  query += ` AND LOWER(sl.severity_name) = ${paramIndex}`;
  queryParams.push(severity.toLowerCase());
  paramIndex++;
}
if (status) {
  query += ` AND LOWER(a.status) = ${paramIndex}`;
  queryParams.push(status.toLowerCase());
  paramIndex++;
}
if (filter) {
  query += ` AND (LOWER(CAST(a.event_id AS TEXT)) LIKE ${paramIndex} OR LOWER(a.raw_message) LIKE ${paramIndex})`;
  queryParams.push(`%${filter.toLowerCase()}%`);
  paramIndex++;
}


  query += ' ORDER BY a.event_time DESC';

  try {
    const result = await pool.query(query, queryParams);
    res.status(200).json(result.rows);
  } catch (error) {
    console.error('Error fetching investigation alerts:', error.message);
    res.status(500).json({ message: 'Internal server error.' });
  }
});

/**
 * @route GET /api/alerts/:eventId
 * @description Fetches a single alert by its event ID.
 * Expects eventId in the URL parameters.
 */
/**
 * @route GET /api/alerts/:eventId
 * @description Fetches a single alert by its event ID.
 * Expects eventId in the URL parameters.
 */
app.get('/api/alerts/:eventId', authenticateToken, async (req, res) => {
  const { eventId } = req.params;
  try {
    const query = `
      SELECT 
        a.event_id,
        a.event_time,
        a.rule_name,
        s.severity_name AS level,
        at.type_name AS type,
        a.source_ip,
        a.destination_ip,
        a.protocol,
        fd.field_value AS firewall_action,
        tr.field_value AS trigger_reason,
        a.closure_result AS user_assessment,
        a.expected_result,
        a.user_assessment_correct,
        CASE
          WHEN a.user_assessment_correct = TRUE THEN 5
          WHEN a.user_assessment_correct = FALSE THEN -2
          ELSE 0
        END AS points
      FROM alerts a
      LEFT JOIN severity_levels s ON a.severity_id = s.severity_id
      LEFT JOIN alert_types at ON a.alert_type_id = at.type_id
      LEFT JOIN alert_details fd ON a.alert_id = fd.alert_id AND fd.field_name = 'Firewall Action'
      LEFT JOIN alert_details tr ON a.alert_id = tr.alert_id AND tr.field_name = 'Alert Trigger Reason'
      WHERE a.event_id = $1
      LIMIT 1;
    `;
    const result = await pool.query(query, [eventId]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Alert not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error' });
  }
});

/**
 * @route GET /api/logs
 * @description Fetches logs with pagination and filtering.
 * Expects query parameters for filtering, pagination, etc.
 */
// GET /api/logs?field=source_ip&op=contains&value=172.16.17.14&page=1&limit=10
app.get('/api/logs', authenticateToken, async (req, res) => {
  try {
    const field = req.query.field || null;
    const op = req.query.op || 'contains';
    const value = req.query.value || '';
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.max(1, parseInt(req.query.limit, 10) || 10);
    const offset = (page - 1) * limit;

    const ALLOWED_FIELDS = new Set([
      'source_ip', 'destination_ip', 'log_source', 'event_id', 'raw_log'
    ]);
    const targetField = ALLOWED_FIELDS.has(field) ? field : null;

    const params = [];
    let whereClause = '';

    if (targetField && value) {
      const fieldAsText = ['event_id'].includes(targetField) ? `${targetField}::text` : targetField;
      if (op === 'equals') {
        whereClause = `WHERE ${fieldAsText} = $1`;
        params.push(value);
      } else {
        let pattern = `%${value}%`;
        if (op === 'startswith') pattern = `${value}%`;
        if (op === 'endswith') pattern = `%${value}`;
        whereClause = `WHERE ${fieldAsText} ILIKE $1`;
        params.push(pattern);
      }
    }

    // Count query uses the same params array
    const countQuery = `SELECT COUNT(*) AS total FROM log_management ${whereClause}`;
    const countResult = await pool.query(countQuery, params);
    const total = Number(countResult.rows[0].total || 0);

    // Prepare list query param indices for LIMIT and OFFSET
    // baseIndex is number of existing params; next index will be baseIndex + 1 etc.
    const baseIndex = params.length;
    const limitIndex = baseIndex + 1;
    const offsetIndex = baseIndex + 2;

    // Create a copy of params and append limit and offset values
    const queryParams = [...params, limit, offset];

    const listQuery = `
      SELECT log_id, event_id, log_source, source_ip, destination_ip,
             source_port, destination_port, log_time, raw_log
      FROM log_management
      ${whereClause}
      ORDER BY log_time DESC
      LIMIT $${limitIndex} OFFSET $${offsetIndex}
    `;

    const listResult = await pool.query(listQuery, queryParams);
    res.json({ rows: listResult.rows, total });
  } catch (err) {
    console.error('GET /api/logs error:', err);
    res.status(500).json({ error: 'Database error' });
  }
});


/**
 * @route GET /api/logs/:id
 * @description Fetches a single log entry by its ID.
 * Expects log ID in the URL parameters.
 */
// Single log details remains the same
/**
 * @route GET /api/logs/:id
 * @description Fetches a single log entry by its ID.
 * Expects log ID in the URL parameters.
 */
app.get('/api/logs/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  try {
    const q = `SELECT * FROM log_management WHERE log_id = $1`;
    const r = await pool.query(q, [id]);
    if (r.rows.length === 0) return res.status(404).json({ error: 'Log not found' });
    res.json(r.rows[0]);
  } catch (err) {
    console.error('Error in /api/logs/:id', err.message);
    console.error(err.stack);
    res.status(500).json({ error: 'Database error', details: err.message });
  }
});

/**
 * @route POST /api/alerts/:alertId/start-investigation
 * @description Start investigating an alert (replaces take-ownership)
 */
app.post('/api/alerts/:alertId/start-investigation', authenticateToken, async (req, res) => {
  const { alertId } = req.params;
  const userId = req.user.id;

  try {
    // 1️⃣ Check alert existence
    const alertExists = await pool.query(
      'SELECT alert_id FROM alerts WHERE alert_id = $1',
      [alertId]
    );

    if (alertExists.rowCount === 0) {
      return res.status(404).json({ message: 'Alert not found.' });
    }

    // 2️⃣ Check if alert is already assigned to someone else
    const existing = await pool.query(
      `SELECT user_id FROM alert_investigations
       WHERE alert_id = $1 AND is_active = TRUE`,
      [alertId]
    );

    if (existing.rowCount > 0) {
      const currentOwner = existing.rows[0].user_id;
      if (currentOwner === userId) {
        return res.status(400).json({ message: 'You already own this alert.' });
      } else {
        return res.status(409).json({ message: 'Alert is already owned by another investigator.' });
      }
    }

    // 3️⃣ Assign ownership (create investigation)
    const result = await pool.query(
      `INSERT INTO alert_investigations (alert_id, user_id, is_active)
       VALUES ($1, $2, TRUE)
       RETURNING investigation_id, alert_id, user_id, started_at`,
      [alertId, userId]
    );

    // 4️⃣ Return success
    return res.status(201).json({
      success: true,
      message: 'Ownership taken successfully.',
      investigation: result.rows[0],
    });
  } catch (err) {
    console.error('Error starting investigation:', err.message);
    return res.status(500).json({ message: 'Failed to start investigation.' });
  }
});



/**
 * @route POST /api/alerts/:alertId/unassign
 * @description Unassigns an alert from the current user.
 */
app.post('/api/alerts/:alertId/unassign', authenticateToken, async (req, res) => {
  const { alertId } = req.params;
  const userId = req.user.user_id;

  try {

    await pool.query('BEGIN');

    // Remove any existing inactive investigation records for this user and alert to avoid constraint violations
    await pool.query(
      `DELETE FROM alert_investigations
       WHERE alert_id = $1 AND user_id = $2 AND is_active = FALSE`,
      [alertId, userId]
    );

    // Now, update the current active investigation to be inactive
    const result = await pool.query(
      `UPDATE alert_investigations
       SET is_active = FALSE
       WHERE alert_id = $1 AND user_id = $2 AND is_active = TRUE
       RETURNING *`,
      [alertId, userId]
    );

    await pool.query('COMMIT');

    if (result.rowCount === 0) {
      return res.status(404).json({ message: 'No active investigation found for this alert.' });
    }

    res.status(200).json({ success: true, investigation: result.rows[0] });

  } catch (err) {
    await pool.query('ROLLBACK');
    console.error('Error unassigning alert:', err.message);
    res.status(500).json({ message: 'Failed to unassign alert' });
  }
});



/**
 * @route POST /api/alerts/:alertId/create-case
 * @description Create a case from an alert during investigation
 */
app.post('/api/alerts/:alertId/create-case', authenticateToken, async (req, res) => {
  const alertId = parseInt(req.params.alertId, 10);
  let userId = parseInt(req.user?.user_id, 10);
  const { title, description, priority } = req.body;
  let { assigned_to } = req.body;

  if (isNaN(alertId)) return res.status(400).json({ message: 'Invalid alertId param' });
  if (isNaN(userId)) return res.status(401).json({ message: 'Invalid user in token' });

  assigned_to = assigned_to !== undefined && assigned_to !== null ? parseInt(assigned_to, 10) : null;
  if (assigned_to !== null && isNaN(assigned_to)) assigned_to = null;

  try {
    await pool.query('BEGIN');

    // Ensure alert exists (use integer alertId)
    const alertCheck = await pool.query(
      `SELECT alert_id FROM alerts WHERE alert_id = $1 LIMIT 1`,
      [alertId]
    );
    if (alertCheck.rowCount === 0) {
      await pool.query('ROLLBACK');
      return res.status(404).json({ message: 'Alert not found.' });
    }

    // Insert case linked to alert_id (pass integer params)
    const caseResult = await pool.query(
      `INSERT INTO cases (
          title, description, priority, status_id, assigned_to, created_by, alert_id
        )
        VALUES (
          $1, $2, COALESCE($3, 3),
          (SELECT status_id FROM case_status WHERE status_name ILIKE 'open' LIMIT 1),
          $4, $5, $6
        )
        RETURNING case_id, case_number, title, description, alert_id, created_at;`,
      [
        title || `Case for alert ${alertId}`,
        description || null,
        priority || 3,
        assigned_to || userId,
        userId,
        alertId
      ]
    );

    // Keep alert metadata in sync (optional update but good for UI)
    await pool.query(
      `UPDATE alerts SET updated_at = NOW(), status = 'Under Investigation' WHERE alert_id = $1`,
      [alertId]
    );

    await pool.query('COMMIT');

    return res.status(201).json({
      success: true,
      message: 'Case created successfully and linked to alert.',
      case: caseResult.rows[0]
    });
  } catch (err) {
    await pool.query('ROLLBACK');
    console.error('Error creating case:', err);
    return res.status(500).json({ message: 'Failed to create case.' });
  }
});


/**
 * @route POST /api/alerts/:alertId/close-alert
 * @description Close an alert and automatically close its linked case
 */
app.post('/api/alerts/:alertId/close-alert', authenticateToken, async (req, res) => {
  const alertId = parseInt(req.params.alertId, 10);
  const userId = parseInt(req.user?.user_id, 10);
  const { reason, result: closeResult, malicious_entity, feedback } = req.body;

  if (isNaN(alertId)) {
    return res.status(400).json({ message: 'Invalid alert ID.' });
  }
  if (isNaN(userId)) {
    return res.status(401).json({ message: 'Invalid user in token.' });
  }

  try {
    // ✅ Confirm alert exists and fetch expected_result
    const alertQuery = await pool.query(
      `SELECT alert_id, expected_result FROM alerts WHERE alert_id = $1 LIMIT 1`,
      [alertId]
    );
    if (alertQuery.rows.length === 0) {
      return res.status(404).json({ message: 'Alert not found.' });
    }
    const { expected_result } = alertQuery.rows[0];

    // ✅ Compute closure correctness (optional)
    let closureCorrect = false;
    if (expected_result && closeResult) {
      closureCorrect =
        String(closeResult).trim().toLowerCase() ===
        String(expected_result).trim().toLowerCase();
    }

    // ✅ Close the alert
    const updateAlert = await pool.query(
      `UPDATE alerts
         SET
           is_closed = TRUE,
           closed_at = CURRENT_TIMESTAMP,
           closed_by = $1,
           status = 'Closed',
           closure_reason = $2,
           closure_result = $3,
           user_assessment_correct = $4,
           malicious_entity = $5,
           feedback = $6,
           updated_at = NOW()
         WHERE alert_id = $7
         RETURNING alert_id, event_id, rule_name, closure_result, expected_result,
                   user_assessment_correct, malicious_entity, feedback, closed_at;`,
      [
        userId,
        reason || null,
        closeResult || null,
        closureCorrect,
        malicious_entity || null,
        feedback || null,
        alertId
      ]
    );

    // ✅ Close the linked case (if it exists)
    await pool.query(
      `UPDATE cases
         SET is_closed = TRUE,
             closed_at = NOW(),
             updated_at = NOW()
       WHERE alert_id = $1;`,
      [alertId]
    );

    return res.status(200).json({
      message: 'Alert and linked case closed successfully.',
      alert: updateAlert.rows[0]
    });
  } catch (err) {
    console.error('❌ Error closing alert and case:', err);
    return res.status(500).json({ message: 'Internal server error while closing alert.' });
  }
});




/**
 * @route PATCH /api/cases/:alertId/reopen
 * @description Reopen a previously closed case and its linked alert
 */
app.patch('/api/cases/:alertId/reopen', authenticateToken, async (req, res) => {
  const { alertId } = req.params;
  try {
    // Reopen the alert
    await pool.query(
      `UPDATE alerts SET is_closed = FALSE WHERE alert_id = $1`,
      [alertId]
    );
    // Reopen the case linked to the alert
    await pool.query(
      `UPDATE cases SET is_closed = FALSE WHERE alert_id = $1`,
      [alertId]
    );
    res.status(200).json({ message: 'Case and alert reopened successfully' });
  } catch (err) {
    console.error('Error reopening case and alert:', err.message);
    res.status(500).json({ message: 'Error reopening case and alert' });
  }
});

/**
 * @route GET /api/cases
 * @description Fetch cases for investigation channel or closed cases
 */
app.get('/api/cases', authenticateToken, async (req, res) => {
  const { assigned_to, status } = req.query;
  const userId = req.user.user_id;

  if (status && status.toLowerCase() === 'closed') {
    // Fetch closed cases for the current user
    try {
      const result = await pool.query(`
        SELECT 
          a.alert_id,
          a.event_id,
          a.event_time       AS "eventTime",
          a.rule_name,
          s.severity_name    AS severity,
          at.type_name       AS alert_type,
          a.expected_result,
          a.user_assessment_correct,
          a.closure_result   AS user_assessment,
          CASE
            WHEN a.user_assessment_correct = TRUE  THEN 5
            WHEN a.user_assessment_correct = FALSE THEN -2
            ELSE 0
          END                AS points,
          a.answers_provided,
          a.answers_correct,
          a.answers_summary,
          a.closed_at
        FROM alerts a
        LEFT JOIN severity_levels s ON a.severity_id = s.severity_id
        LEFT JOIN alert_types     at ON a.alert_type_id = at.type_id
        WHERE a.is_closed = TRUE
          AND a.closed_by = $1
        ORDER BY a.closed_at DESC;
      `, [userId]);
      return res.status(200).json(result.rows);
    } catch (err) {
      console.error('Error fetching closed cases:', err.message);
      return res.status(500).json({ message: 'Internal server error.' });
    }
  } else {
    // Fetch cases for investigation channel
    const queryParams = [];
    const conditions = [];
    let paramIndex = 1;

    let sql = `
      SELECT
        cases.*,
        users.username AS assigned_to_name,
        case_status.status_name AS case_status
      FROM cases
      JOIN users ON cases.assigned_to = users.user_id
      JOIN case_status ON cases.status_id = case_status.status_id
    `;

    if (assigned_to) {
      conditions.push(`cases.assigned_to = $${paramIndex}`);
      queryParams.push(parseInt(assigned_to));
      paramIndex++;
    }

    if (status) {
      conditions.push(`case_status.status_name ILIKE $${paramIndex}`);
      queryParams.push(status);
      paramIndex++;
    }

    if (conditions.length > 0) {
      sql += ' WHERE ' + conditions.join(' AND ');
    }

    sql += ' ORDER BY cases.created_at DESC';

    try {
      const result = await pool.query(sql, queryParams);
      return res.status(200).json(result.rows);
    } catch (err) {
      console.error(err);
      return res.status(500).json({ message: 'Internal server error.' });
    }
  }
});




/**
 * @route GET /api/virustotal/scan
 * @description Scans a query (IP, domain, or hash) using the VirusTotal API.
 */
app.get('/api/virustotal/scan', authenticateToken, async (req, res) => {
  const { query } = req.query;
  const VIRUSTOTAL_API_KEY = process.env.VIRUSTOTAL_API_KEY;

  if (!query) {
    return res.status(400).json({ message: 'Query parameter is required.' });
  }

  if (!VIRUSTOTAL_API_KEY) {
    return res.status(500).json({ message: 'VirusTotal API key not configured in environment variables.' });
  }

  let url = '';
  let type = '';

  // Determine if the query is an IP address, domain, or hash
  const ipRegex = /^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$/;
  const domainRegex = /^[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  const hashRegex = /^[a-f0-9]{32}$|^[a-f0-9]{40}$|^[a-f0-9]{64}$/i; // MD5, SHA1, SHA256

  if (ipRegex.test(query)) {
    url = `https://www.virustotal.com/api/v3/ip_addresses/${query}`;
    type = 'ip_address';
  } else if (domainRegex.test(query)) {
    url = `https://www.virustotal.com/api/v3/domains/${query}`;
    type = 'domain';
  } else if (hashRegex.test(query)) {
    url = `https://www.virustotal.com/api/v3/files/${query}`;
    type = 'file';
  } else {
    return res.status(400).json({ message: 'Invalid query format. Please provide a valid IP, domain, or file hash.' });
  }

  try {
    const response = await axios.get(url, {
      headers: {
        'x-apikey': VIRUSTOTAL_API_KEY,
        'Accept': 'application/json',
      },
    });

    const data = response.data;

    // Process the VirusTotal response to extract relevant information
    const attributes = data.data.attributes;
    const analysisResults = attributes.last_analysis_results;
    let detected = 0;
    const detections = {};

    for (const engine in analysisResults) {
      if (analysisResults[engine].category === 'malicious') {
        detected++;
        detections[engine] = {
          category: analysisResults[engine].category,
          result: analysisResults[engine].result,
          method: analysisResults[engine].method,
        };
      }
    }

    res.status(200).json({
      query: query,
      type: type,
      total_engines: Object.keys(analysisResults).length,
      detected_by: detected,
      detections: detections,
      last_analysis_date: new Date(attributes.last_analysis_date * 1000).toLocaleString(),
      // You can add more attributes from the VT response if needed
    });

  } catch (error) {
    console.error('Error calling VirusTotal API:', error);
    res.status(500).json({ message: 'Internal server error when calling VirusTotal API.', error: error.message });
  }
});



/**
 * @route GET /api/emails
 * @description Fetches all email logs.
 */
app.get('/api/emails', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query('SELECT email_alert_id as id, sender_email as sender, email_subject as subject, attachment_hashes as attachments, \'Clean\' as status FROM email_security ORDER BY created_at DESC');
    res.status(200).json(result.rows);
  } catch (error) {
    console.error('Error fetching email logs:', error.message);
    res.status(500).json({ message: 'Internal server error.' });
  }
});

/**
 * @route POST /api/cases/:caseId/answers
 * @description Save all answers for a case (frontend provides correctness + points)
 */
app.post('/api/cases/:caseId/answers', authenticateToken, async (req, res) => {
  const caseId = parseInt(req.params.caseId, 10);
  const userId = parseInt(req.user?.user_id, 10);
  const { answers, total_points } = req.body;

  if (isNaN(caseId)) return res.status(400).json({ message: 'Invalid caseId param' });
  if (isNaN(userId)) return res.status(401).json({ message: 'Invalid user in token' });

  try {
    // Ensure the case exists (guardrail)
    const caseCheck = await pool.query('SELECT case_id FROM cases WHERE case_id = $1 LIMIT 1', [caseId]);
    if (caseCheck.rowCount === 0) {
      return res.status(404).json({ message: 'Case not found.' });
    }

    // Insert or update answers; ensure we pass integers for case_id and user_id
    await pool.query(
      `INSERT INTO case_user_responses (case_id, user_id, answers, total_points)
       VALUES ($1, $2, $3::jsonb, $4)
       ON CONFLICT (case_id, user_id)
       DO UPDATE SET answers = EXCLUDED.answers, total_points = EXCLUDED.total_points, updated_at = NOW()`,
      [caseId, userId, JSON.stringify(answers || {}), total_points || 0]
    );

    return res.status(200).json({ message: 'Answers saved successfully' });
  } catch (err) {
    console.error('Error saving answers:', err);
    return res.status(500).json({ message: 'Error saving answers' });
  }
});



/**
 * @route DELETE /api/delete-account
 * @description Allows a logged-in user to delete their account.
 */
app.delete('/api/delete-account', authenticateToken, async (req, res) => {
  const userId = req.user.user_id; // Get user ID from authenticated token

  try {
    // Call the soft_delete_user function
    const result = await pool.query('SELECT soft_delete_user($1)', [userId]);

    // The function returns void, so we check if any row was affected by the internal UPDATE
    // This check might be more complex if the function doesn't return anything useful
    // For now, we assume if no error, it was successful.
    res.status(200).json({ message: 'Account soft-deleted successfully.' });

  } catch (error) {
    console.error('Error during account soft-deletion:', error.message);
    res.status(500).json({ message: 'Internal server error during account deletion.' });
  }
});


/**
 * @route POST /api/reset-alerts
 * @description Resets all closed alerts and active investigations.
 */
app.post('/api/reset-alerts', authenticateToken, async (req, res) => {
  try {
    await pool.query('BEGIN');

    // Reset all closed alerts to open status
    await pool.query(
      `UPDATE alerts
       SET
         is_closed = FALSE,
         status = 'Open',
         closed_at = NULL,
         closed_by = NULL,
         closure_reason = NULL,
         closure_result = NULL,
         expected_result = NULL,
         user_assessment_correct = NULL,
         answers_provided = FALSE,
         answers_correct = FALSE,
         answers_summary = NULL,
         malicious_entity = NULL,
         feedback = NULL,
         updated_at = NOW()
       WHERE is_closed = TRUE;`
    );

    // Deactivate all active investigations
    await pool.query(
      `UPDATE alert_investigations
       SET is_active = FALSE
       WHERE is_active = TRUE;`
    );

    await pool.query('COMMIT');
    res.status(200).json({ message: 'All alerts and investigations have been reset.' });
  } catch (err) {
    await pool.query('ROLLBACK');
    console.error('Error resetting alerts:', err.message);
    res.status(500).json({ message: 'Failed to reset alerts.' });
  }
});


// Start the server
app.listen(port, () => {
  console.log(`Backend server listening at http://localhost:${port}`);
});



