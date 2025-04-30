# DnD Scheduler - Enhanced Version

A comprehensive web application for scheduling D&D sessions with your group. This app helps players indicate their availability and makes it easy to find the best time for everyone to play.

## Features

- **User Authentication System**
   - Login/password management
   - Password setting for new users
   - Admin account for site management

- **Date-Based Calendar**
   - Infinite scrolling calendar with real dates
   - Weekly view with mobile optimization
   - Visual indicators for user availability
   - Overview of all users' availability

- **Admin Dashboard**
   - User management (add, edit, delete users)
   - Admin password management
   - Announcement system with color options
   - Poll creation and management
   - Settings configuration

- **Polls System**
   - Regular polls with visible results
   - Blind polls where results are hidden until voting
   - Visual result display

- **Theme Support**
   - Dark/light mode toggle
   - System preference detection
   - Theme persistence

- **Mobile-First Design**
   - Responsive layouts for all screen sizes
   - Optimized calendar view for mobile devices

## Tech Stack

- **Next.js** (React framework with both frontend and backend)
- **TypeScript** for type safety
- **Tailwind CSS** for styling
- **MongoDB** for data storage
- **date-fns** for date manipulation

## Getting Started

### Prerequisites

- Node.js 16+ and npm
- MongoDB (local installation or MongoDB Atlas account)

### Installation

1. Clone the repository:
   ```
   git clone https://github.com/theprogrammerknownasat/dnd-scheduler.git
   cd dnd-scheduler
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Set up environment variables:
   Create a `.env.local` file in the root directory with the following:
   ```
   MONGODB_URI=mongodb://localhost:27017/dnd-scheduler
   ```
   Replace the URI with your MongoDB connection string if using a remote database.

4. Run the development server:
   ```
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

### Database Setup

If migrating from the old JSON-based storage:

1. Install MongoDB client for the migration script:
   ```
   npm install mongodb
   ```

2. Run the migration script:
   ```
   node scripts/migrate-to-mongodb.js
   ```

If starting fresh, the app will automatically create:
- An admin user with username "admin" and no password
- You'll be prompted to set the admin password on first login

## Usage Guide

### Initial Setup

1. Log in with username "admin" (no password)
2. Set a password when prompted
3. Use the admin dashboard to add your players
4. Configure available weeks in the future (default is 12 weeks)

### User Experience

1. Players log in with the username provided by the admin
2. On first login, they set their own password
3. Players mark their availability on the calendar
4. Players can view when others are available
5. Players can participate in polls

### Admin Features

#### User Management
- Add new players by username
- Edit usernames and reset passwords
- Delete user accounts (except admin)
- View active users currently on the site

#### Announcements
- Create announcements visible to all users
- Select announcement color (yellow, red, green, blue)
- Clear announcements when no longer needed

#### Polls
- Create regular or blind polls
- View poll results
- Delete polls when completed

#### Settings
- Set maximum weeks visible in the future
- Change admin password

## Deployment

This app can be deployed on Vercel, Netlify, or any platform that supports Next.js applications. Make sure to set up your environment variables on your hosting platform.

## Contributing

Feel free to submit issues or pull requests if you want to contribute to the project.

## License

This project is licensed under the MIT License.
