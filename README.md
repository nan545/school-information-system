# Apex School Information System

A React/Vite student information portal backed by Express, Prisma, and SQLite.

## Setup

1. Install Node.js 22 or later and run `npm install`.
2. Copy `.env.example` to `.env` and set a unique `JWT_SECRET` for deployments.
3. Apply the Prisma schema and generate the client:

   ```sh
   npx prisma db push
   npx prisma generate
   ```

   This project currently uses Prisma schema synchronization (`db push`); it does not have a migration history. Back up an existing SQLite database before applying schema changes.
4. Start the development server with `npm run dev`.

Run `npm run lint` for TypeScript checks and `npm run build` to build the frontend.

## Student portal features

- Browse current course offerings, check enrollment capacity and status, enroll or withdraw, and review enrollment history.
- View grade reports and summaries. Authorized teachers and administrators can record or correct grades; grade changes notify the affected student.
- View and manage personal notifications from the notification bell. Enrollment and grade events create persistent notifications.

Course enrollment is available while an academic year is marked current and course enrollment is open. Student enrollment is limited to the student's assigned class and available course capacity.
