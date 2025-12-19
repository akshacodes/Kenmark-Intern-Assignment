# Leave and Productivity Analyzer

A full-stack Monthly Attendance and Productivity Analysis Dashboard built with Next.js 15, Prisma, and MongoDB. This application processes Excel attendance sheets to calculate employee productivity, track leaves against company policy, and visualize performance data.

## Live Demo

Access the deployed application here:
**(https://kenmark-intern-assignment.vercel.app/)**

## Project Overview

This tool allows HR or management to upload raw daily attendance logs in Excel format. It automatically parses the data, applies specific business logic for working hours, and generates a comprehensive dashboard with productivity metrics and visual charts.

## Key Features

- **Excel Upload Processing:** Supports bulk upload of employee attendance data (.xlsx format).
- **Automated Business Logic:**
  - Mon-Fri: 8.5 working hours expected.
  - Saturday: 4.0 working hours expected (Half-day).
  - Sunday: Off.
- **Productivity Analysis:** Calculates productivity percentage based on the total expected hours for the specific month versus actual hours worked.
- **Leave Tracking:** Tracks absences against a monthly limit of 2 leaves.
- **Visual Analytics:** Bar charts and detailed daily breakdown tables.
- **Export:** Download monthly reports as CSV.

## Tech Stack

- **Frontend:** Next.js 15 (App Router), Tailwind CSS, Recharts
- **Backend:** Next.js API Routes
- **Database:** MongoDB Atlas
- **ORM:** Prisma 5 (Stable)
- **File Processing:** XLSX (SheetJS)
- **Deployment:** Vercel

## How to Test the Live Application

1. **Download Sample Data:**
   Download the `sample_attendance.xlsx` file provided in this repository to your computer.

2. **Access the Dashboard:**
   Click the Live Demo link above.

3. **Upload Data:**
   Click the "Upload Data" button on the dashboard and select the `sample_attendance.xlsx` file.

4. **Verify Results:**
   - Check the "Monthly Summary" table.
   - Verify that Saturdays are counted as 4 hours.
   - Verify that missing days are flagged in red under "Leaves".
   - View the "Productivity Comparison" graph.

5. **Download Report:**
   Click the "Download Report" button to export the analysis as a CSV file.

## Project Structure

- `app/page.tsx`: Main Dashboard UI containing Charts, Tables, and Logic.
- `app/api/upload`: API route for parsing Excel files and saving data to MongoDB.
- `app/api/stats`: API route for calculating business logic (Productivity, Leaves, Expected Hours).
- `prisma/schema.prisma`: MongoDB Database Schema.

---

**Developed for Kenmark ITan Solutions Technical Assignment.**