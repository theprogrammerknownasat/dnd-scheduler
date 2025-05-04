# DnD Scheduler

A mobile-friendly web application for scheduling D&D sessions with your group. This app helps players indicate their availability and makes it easy for DMs to find the best time for everyone to play.

## Core Features

### Availability Management
- Mark your availability on a time-slot calendar
- See when other players are available
- Drag to select multiple time slots at once
- Visual heat map showing group availability
- Mobile-optimized interface with expandable days

### Session Scheduling
- DMs can schedule sessions at times when most players are available
- Session details include title, time, and optional notes
- Upcoming and past sessions are clearly displayed
- Everyone can see scheduled sessions at a glance

### Group Management
- Campaign-based organization for different D&D groups
- Multiple campaigns support for players in various groups
- Admin tools for managing users and campaigns
- Automatic tracking of active users

### Polls & Communication
- Create polls for group decision making
- Support for regular and blind polls with visible/hidden results
- Campaign announcements for important updates
- Color-coded announcements for different priority levels

## User Experience

### Players Can:
- Mark and update their availability with simple clicks/taps
- See when their friends are available
- Get notified of scheduled sessions
- Vote on polls
- Switch between campaigns if they belong to multiple groups
- Customize display preferences in their profile

### DMs Can:
- See when most players are available for scheduling
- Create and manage sessions
- Create polls for group decisions
- Post announcements for the campaign
- Manage which players are in their campaign

### Admins Can:
- Manage all users across the platform
- Create and configure campaigns
- Assign DM privileges
- Monitor site activity and usage
- Configure global settings

## Technical Details

### Built With:
- **Next.js 13+** with App Router for both frontend and API routes
- **TypeScript** for type safety and code quality
- **TailwindCSS** for responsive styling
- **MongoDB** for database storage
- **date-fns** for comprehensive date handling

### Key Features:
- Responsive design works on mobile, tablet, and desktop
- Dark mode and light mode support with system preference detection
- Real-time availability visualization
- Optimized calendar views for different screen sizes

## Getting Started

### Prerequisites
- Node.js 18+ and npm
- MongoDB connection (local or Atlas)

### Installation
1. Clone the repository
   ```
   git clone https://github.com/yourusername/dnd-scheduler.git
   cd dnd-scheduler
   ```

2. Install dependencies
   ```
   npm install
   ```

3. Set up environment variables by creating a `.env.local` file:
   ```
   MONGODB_URI=your_mongodb_connection_string
   JWT_SECRET=your_secret_key_for_tokens
   ```

4. Run the development server
   ```
   npm run dev
   ```

5. Navigate to `http://localhost:3000` in your browser

### First-Time Setup
When first accessing the application:
1. You'll be prompted to create an admin account
2. Use the admin tools to create campaigns and add users
3. Add players to campaigns
4. Players can then set their availability

## Deployment
This application can be deployed on Vercel, Netlify, or any platform supporting Next.js:

1. Connect your Git repository to your preferred hosting platform
2. Configure the environment variables
3. Deploy from your main branch

## Screenshots

*(Screenshots will be added here to showcase the application's interface)*

## License
This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments
- Thanks to the D&D community for inspiring this project
- Built with the needs of busy player groups in mind