# Job Outreach Automation Platform

## Project Overview
The Job Outreach Automation Platform is designed to streamline the job search process by automating contact discovery, message customization, and outreach tracking. It helps users manage their job applications and leverage referrals effectively.

## Tech Stack
- **Frontend**: Next.js 14+, React, TypeScript, Tailwind CSS, shadcn/ui
- **Backend**: Node.js (Express) with TypeScript (migratable to FastAPI)
- **Database**: Supabase
- **State Management**: React Query
- **API Client**: Axios

## B-MAD Workflow Status Tracker
- [ ] Project Setup
- [ ] PRD & Architecture Documentation
- [ ] Core Services Implementation
- [ ] Frontend Dashboard
- [ ] Integration Testing

## Setup Instructions

### Prerequisites
- Node.js 18+
- npm or yarn
- Supabase account

### Installation

1.  **Clone the repository:**
    ```bash
    git clone <repository-url>
    cd job-outreach-system
    ```

2.  **Install dependencies:**
    ```bash
    # Frontend
    cd frontend
    npm install

    # Backend
    cd ../backend
    npm install
    ```

3.  **Environment Setup:**
    - Copy `.env.example` to `.env` in both `frontend` and `backend` directories.
    - Fill in your Supabase credentials and other API keys.

4.  **Run the application:**
    ```bash
    # Frontend
    cd frontend
    npm run dev

    # Backend
    cd backend
    npm run dev
    ```

## Structure
- `/docs`: B-MAD generated documents
- `/src`: Application code (Frontend/Backend source)
- `/tests`: Test files
- `/.github/workflows`: CI/CD configurations

