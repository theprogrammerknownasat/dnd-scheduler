# DnD Scheduler

A mobile-friendly web application for scheduling D&D sessions with your group. This app helps players indicate their availability and makes it easy for DMs to find the best time for everyone to play.

## Core Features

### Availability Management
- Mark your availability on a time-slot calendar with intuitive click/tap interface
- See when other players are available with color-coded visualization
- Drag to select multiple time slots at once (desktop)
- Visual heat map showing group availability levels
- Mobile-optimized interface with expandable days and touch-friendly controls

### Session Scheduling
- DMs can schedule sessions at times when most players are available
- Session details include title, time, and optional notes
- Upcoming and past sessions are clearly displayed
- Built-in current time indicator shows when sessions are in progress
- Sessions appear directly in the calendar with blue highlighting

### Group Management
- Campaign-based organization for different D&D groups
- Multiple campaigns support for players in various groups
- Admin tools for managing users and campaigns
- Contact admin button for user support
- Automatic tracking of active users

### Polls & Communication
- Create polls for group decision-making
- Support for regular and blind polls with visible/hidden results
- Campaign announcements for important updates
- Color-coded announcements for different priority levels

### Help & Guidance
- Interactive guided tour for new users
- Feature tooltips and explanations
- Mobile-specific and desktop-specific help guides
- Accessible help button in the header

## User Experience

### Players Can:
- Mark and update their availability with simple clicks/taps
- See when their friends are available with colored availability charts
- Get notified of scheduled sessions
- Vote on polls for campaign decisions
- Switch between campaigns if they belong to multiple groups
- Customize display preferences (12h/24h time, session limits) in their profile
- View real-time current time indicator
- Access interactive help guide at any time

### DMs Can:
- See when most players are available for scheduling
- Create and manage sessions with titles, times, and notes
- Create polls for group decisions
- Post color-coded announcements for the campaign
- Manage which players are in their campaign
- Set campaign as default for quick access

### Admins Can:
- Manage all users across the platform
- Create and configure campaigns
- Assign DM privileges to users
- Monitor site activity and usage
- Configure global settings and announcements
- Contact users directly
- Change user passwords if needed

## Technical Details

### Built With:
- **Next.js 13+** with App Router for both frontend and API routes
- **TypeScript** for type safety and code quality
- **TailwindCSS** for responsive styling
- **MongoDB** for database storage
- **date-fns** for comprehensive date handling
- **Docker** for containerized deployment

### Key Features:
- Responsive design works on mobile, tablet, and desktop
- Dark mode and light mode support with system preference detection
- Real-time availability visualization
- Optimized calendar views for different screen sizes
- Timezone-aware scheduling
- Session limit customization per user
- Guided help for new users

## Getting Started (Development)

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
   ```

4. Run the development server
   ```
   npm run dev
   ```

5. Navigate to `http://localhost:3000` in your browser

### First-Time Setup
When first accessing the application:
1. Visit the page, and an admin account and database will be automatically created
2. Admin username: `admin` (set password at first login)
3. Use the admin tools to create campaigns and add users
4. Add players to campaigns
5. Players can then set their availability

## Docker Deployment

### Requirements
- Docker and Docker Compose installed
- No Node.js/npm required on production server

### Building for Production

#### On Development Machine:

```bash
# 1. Build the Docker image
docker build -t dnd-scheduler-app .

# 2. Save the image as a tar file
docker save -o dnd-scheduler-app.tar dnd-scheduler-app

# 3. Save MongoDB image
docker pull mongo:6
docker save -o mongo-6.tar mongo:6

# 4. Transfer these files to your production server:
# - dnd-scheduler-app.tar
# - mongo-6.tar
# - docker-compose.yml
```

#### On Production Server:

```bash
# 1. Load the Docker images
docker load -i dnd-scheduler-app.tar
docker load -i mongo-6.tar

# 2. Create .env file
echo "NODE_ENV=production" > .env
echo "MONGODB_URI=mongodb://mongo:27017/dnd-scheduler" >> .env

# 3. Start the application
docker-compose up -d

# 4. Check if it's running
docker-compose ps
docker-compose logs app

# 5. Initialize the database
# Visit http://localhost:3000/api/init in browser
```

### Docker Configuration

The application uses two containers:
- **app**: Next.js application server
- **mongo**: MongoDB database with persistent volume

Data is stored in Docker volumes, ensuring it persists between container restarts.

### Using with Cloudflare Tunnel

After starting the Docker containers:

```bash
cloudflared tunnel --url http://localhost:3000
```

This creates a secure tunnel to access your application remotely.

### Useful Docker Commands

```bash
# View logs
docker-compose logs -f app

# Restart the application
docker-compose restart app

# Stop everything
docker-compose down

# Backup database
docker-compose exec mongo mongodump --out=/data/db/backups
```

## Updates and Maintenance

To update the application:

1. Update your code on the development machine
2. Rebuild the Docker image
3. Save and transfer the new image to production
4. Load the new image and restart the container
5. Database data persists automatically

## Security Notes

- The application runs as a non-root user inside Docker
- MongoDB is not exposed to the internet (only accessible within Docker network)
- Use Cloudflare Tunnel for secure remote access
- Admin password should be changed from default on first login

## Troubleshooting

### Common Issues:

1. **Port conflicts**: Change ports in docker-compose.yml if needed
2. **Database connection**: Ensure MongoDB container is running first
3. **File permissions**: Check that Docker has permission to read/write volumes

### Support

For issues or feature requests, please create an issue in the GitHub repository.

## License
This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments
- Thanks to the D&D community for inspiring this project
- Built with the needs of busy player groups in mind