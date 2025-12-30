# Online DB Setup Guide

This guide explains how to set up the Online DB for a new department/use case.

## 1. Google Sheet & Apps Script Setup

1.  **Create a Google Sheet**
    *   Create a new Google Sheet.
    *   Rename the first sheet to `Students`.
    *   Add the following headers to row 1 of `Students`:
        *   `id`, `name`, `grade`, `classNum`, `number`, `gender`, `birthDate`
    *   Create a second sheet named `Attendance`.
    *   Add the following headers to row 1 of `Attendance`:
        *   `id`, `studentId`, `date`, `status`, `timestamp`

2.  **Add Apps Script**
    *   In the Google Sheet, go to **Extensions > Apps Script**.
    *   Delete any existing code in `Code.gs`.
    *   Copy the contents of `google-apps-script.js` from this repository and paste it into the script editor.
    *   Save the project (Ctrl+S).

3.  **Deploy as Web App**
    *   Click **Deploy > New deployment**.
    *   Click the **Select type** (gear icon) next to "Select type" and choose **Web app**.
    *   **Description**: Enter a description (e.g., "Online DB API").
    *   **Execute as**: Select **Me** (your email).
    *   **Who has access**: Select **Anyone**. (Important: This allows the web app to access the data without user login).
    *   Click **Deploy**.
    *   **Authorize Access**: You will be asked to authorize the script. Click "Review permissions", choose your account, click "Advanced", and then "Go to (Project Name) (unsafe)". Click "Allow".
    *   **Copy the Web App URL**: You will see a URL ending in `/exec`. Copy this URL.

## 2. GitHub Repository Setup

1.  **Create a Repository**
    *   Create a new empty repository on GitHub.

2.  **Push Code**
    *   Initialize git in this folder if not already done:
        ```bash
        git init
        git add .
        git commit -m "Initial commit"
        ```
    *   Add your new repository as remote:
        ```bash
        git remote add origin https://github.com/agent-berrygood/nowkids-online-1
        git branch -M main
        git push -u origin main
        ```

## 3. GitHub Pages Configuration

1.  **Configure Pages**
    *   Go to your GitHub repository **Settings > Pages**.
    *   Under **Build and deployment**, select **Source** as **GitHub Actions**.
    *   (The workflow file `.github/workflows/deploy.yml` will handle the rest).

2.  **Set Environment Variable**
    *   Go to **Settings > Secrets and variables > Actions**.
    *   Click **Variables** tab (not Secrets).
    *   Click **New repository variable**.
    *   **Name**: `NEXT_PUBLIC_API_URL`
    *   **Value**: Paste the Google Apps Script Web App URL you copied earlier.
    *   Click **Add variable**.

3.  **Trigger Deployment**
    *   Push a change to `main` or manually trigger the workflow from the **Actions** tab to start the deployment.

## 4. Verification

*   Once the GitHub Action completes, your site will be live at `https://<username>.github.io/<repo-name>/`.
*   Test by entering data in the Google Sheet and checking if it appears on the site (or vice versa).
