# Proving Grounds - Security Simulation Platform

## Project Overview

Proving Grounds is a web-based security simulation platform for SOC analysts. It provides a safe environment to practice investigating security alerts, analyzing logs, and managing cases.

## Prerequisites

Before you begin, ensure you have the following installed on your Windows machine:

*   **Node.js and npm:** [Download and install Node.js](https://nodejs.org/en/download/) (npm is included).
*   **PostgreSQL:** [Download and install PostgreSQL](https://www.postgresql.org/download/windows/). During installation, you will be prompted to set a password for the `postgres` user. Remember this password.
*   **Git:** [Download and install Git](https://git-scm.com/download/win).

## Installation

1.  **Clone the repository:**

    ```bash
    git clone https://github.com/Janardan-Pathak1/ProvingGrounds.git
    cd proving-grounds
    ```

2.  **Backend Setup:**

    *   Navigate to the `backend` directory:
        ```bash
        cd backend
        ```
    *   Install the dependencies:
        ```bash
        npm install
        ```

3.  **Frontend Setup:**

    *   Navigate to the root project directory:
        ```bash
        cd ..
        ```
    *   Install the dependencies:
        ```bash
        npm install
        ```

4.  **Database Setup:**

    *   Open the `psql` command-line tool or a graphical tool like pgAdmin.
    *   Create a new database named `ProvingGrounds`:
        ```sql
        CREATE DATABASE "ProvingGrounds";
        ```
    *   Connect to the new database:
        ```sql
        \c "ProvingGrounds"
        ```
    *   Import the database schema and data from the `database.sql` file:
        ```bash
        psql -U <user> -d ProvingGrounds -f ../database.sql
        ```
        You will be prompted for the `postgres` user password.

## Configuration

1.  **Backend Environment Variables:**

    *   In the `backend` directory, you will find a `.env` file. This file contains the environment variables for the application.
    *   The default database connection settings are:
        ```
        PGUSER=
        PGHOST=localhost
        PGDATABASE=ProvingGrounds
        PGPASSWORD=
        PGPORT=5432
        ```
    *   If you used a different password for the `postgres` user during PostgreSQL installation, you need to update the `PGPASSWORD` variable in the `.env` file.

## Running the Application

1.  **Start the Backend Server:**

    *   Navigate to the `backend` directory:
        ```bash
        cd backend
        ```
    *   Start the server:
        ```bash
        node server.js
        ```
    *   The backend server will be running on `http://localhost:5000`.

2.  **Start the Frontend Application:**

    *   Navigate to the root project directory:
        ```bash
        cd ..
        ```
    *   Start the React development server:
        ```bash
        npm start
        ```
    *   The frontend application will open in your default web browser at `http://localhost:3000`.

## Stopping the Application

*   **To stop the backend server:** Press `Ctrl + C` in the terminal where the backend server is running.
*   **To stop the frontend application:** Press `Ctrl + C` in the terminal where the frontend development server is running.
