 # Diagnostic-PC-Intelligent

Diagnostic-PC-Intelligent is an innovative tool designed to help users diagnose and understand potential issues with their Windows PC. It combines local data collection with powerful AI analysis to provide insightful reports and a conversational interface for further inquiries.

## Overview

The project consists of three main components:

1.  **Frontend (React + Vite + TypeScript)**: A user-friendly web interface where users can describe their PC problem, download a data collection script, upload the generated diagnostic information, view an AI-generated report, and chat with an AI for further assistance.
2.  **Backend (Node.js + Express + TypeScript)**: A robust server application that handles API requests from the frontend. It orchestrates the diagnostic process by sending the collected system information to a generative AI (Google Gemini) for analysis and facilitates the chat functionality.
3.  **Data Collection Script (`collect_windows_info.bat`)**: A batch script for Windows that gathers essential system information, hardware details, running processes, event logs, and more, saving it into a `DiagnosticInfo.txt` file.

## Features

-   **Guided Data Collection**: Users are prompted to download and run a script that collects comprehensive system information.
-   **AI-Powered Diagnostics**: Uploaded system information (as plain text) is analyzed by Google Gemini to identify potential issues and provide explanations.
-   **Detailed Reports**: The frontend displays a structured report based on the AI's analysis.
-   **Interactive AI Chat**: Users can ask follow-up questions or seek clarification about their PC's health through a chat interface powered by Gemini.
-   **Asynchronous Processing**: Diagnostic tasks are handled asynchronously, allowing users to track the status (Pending, Processing, Completed, Failed).

## Technology Stack

-   **Frontend**:
    -   React
    -   Vite
    -   TypeScript
    -   Tailwind CSS (or other CSS solution as implemented)
    -   Axios (for API calls)
-   **Backend**:
    -   Node.js
    -   Express.js
    -   TypeScript
    -   Google Gemini API (`@google/generative-ai`)
-   **Data Collection**:
    -   Windows Batch Script (`.bat`)

## Project Structure

```
.
├── backend/                  # Node.js Express backend
│   ├── src/
│   │   ├── services/         # AI interaction logic
│   │   ├── routes/           # API routes
│   │   ├── index.ts          # Backend entry point
│   │   └── ...
│   ├── package.json
│   └── tsconfig.json
├── frontend/                 # React Vite frontend
│   ├── public/
│   │   └── scripts/
│   │       └── collect_windows_info.bat # Data collection script
│   ├── src/
│   │   ├── App.tsx           # Main application component
│   │   ├── main.tsx          # Frontend entry point
│   │   ├── components/       # UI components
│   │   ├── pages/            # Page components
│   │   ├── services/         # API service calls
│   │   └── ...
│   ├── package.json
│   └── tsconfig.json
├── package.json              # Root package.json (if any, for workspace or global scripts)
└── README.md
```

## Prerequisites

-   Node.js (v18 or later recommended)
-   npm or yarn
-   A Google Gemini API Key

## Setup and Running the Application

### 1. Backend Setup

Navigate to the `backend` directory:
```bash
cd backend
```

Install dependencies:
```bash
npm install
```

Create a `.env` file in the `backend` directory and add your Gemini API key:
```env
GEMINI_API_KEY=YOUR_GEMINI_API_KEY
```

Start the backend server (development mode):
```bash
npm run dev
```
The backend server will typically run on `http://localhost:3001`.

### 2. Frontend Setup

Navigate to the `frontend` directory:
```bash
cd frontend
```

Install dependencies:
```bash
npm install
```

Start the frontend development server:
```bash
npm run dev
```
The frontend application will typically be accessible at `http://localhost:5173`.

## How It Works

1.  **Problem Description**: The user describes their PC issue in the frontend.
2.  **Data Collection**:
    *   The user downloads the `collect_windows_info.bat` script from `frontend/public/scripts/`.
    *   The user runs this script on their Windows PC. It generates a `DiagnosticInfo.txt` file containing system details.
3.  **Upload Information**: The user uploads the `DiagnosticInfo.txt` file through the frontend.
4.  **Frontend Processing**: The frontend reads the `.txt` file as plain text.
5.  **Backend Analysis**:
    *   The frontend sends the problem description and the plain text content of `DiagnosticInfo.txt` to the backend's `/api/collecte` endpoint.
    *   The backend creates a diagnostic task and sends the system information text to the Google Gemini API for analysis.
6.  **Report Generation**: Once Gemini processes the information, the backend updates the task status.
7.  **View Report**: The frontend polls for the task status and displays the AI-generated report when completed.
8.  **AI Chat**: The user can then use the chat interface to ask further questions, which are relayed to Gemini via the backend.

## Environment Variables

-   **Backend (`backend/.env`)**:
    -   `GEMINI_API_KEY`: Your Google Gemini API key. Essential for AI analysis and chat.
    -   `PORT` (optional): Port for the backend server (defaults to 3001).

## Future Enhancements

-   **Data Persistence**: Implement a database (e.g., Supabase, PostgreSQL, MongoDB) to store diagnostic reports and user information.
-   **Cross-Platform Data Collection**: Develop data collection scripts or agents for macOS and Linux.
-   **User Authentication**: Add user accounts to save diagnostic history.
-   **Enhanced UI/UX**: Further refine the user interface for a more polished experience.
