# Chatterpillar - Real-Time Chat Application

Chatterpillar is a full-featured, real-time chat application built with modern web technologies. It supports direct messaging, group chats, media sharing, and advanced features like message scheduling, bookmarks, and polls.

![Chatterpillar Logo](https://via.placeholder.com/800x400?text=Chatterpillar+Chat+App)

## Features

### Authentication & User Management
- 🔑 Secure authentication with JWT
- 👤 User profiles with customizable avatars
- 🔄 Session management

### Messaging
- 💬 Real-time direct messaging
- 👥 Group conversations
- ✓✓ Read receipts
- ⌨️ Typing indicators
- 📅 Schedule messages for future delivery
- 🔄 AI-powered conversation summaries

### Media & Attachments
- 📷 Image sharing
- 📎 Document attachments
- 🎤 Voice messages
- 📊 Interactive polls in group chats

### Engagement Features
- 😀 Message reactions
- 🔖 Bookmark important messages
- 🔔 Notifications for new messages

### User Experience
- 🎨 Customizable themes
- 📱 Responsive design for all devices
- 🌗 Light and dark mode support
- 🧠 AI-powered "Helper" assistant

## Technology Stack

### Frontend
- **React** with hooks for UI components
- **React Router** for navigation
- **Zustand** for state management
- **TailwindCSS** with DaisyUI for styling
- **Socket.IO Client** for real-time communication
- **Axios** for HTTP requests
- **React Hot Toast** for notifications

### Backend
- **Node.js** with **Express** for the server
- **MongoDB** with Mongoose for database
- **Socket.IO** for real-time communication
- **JWT** for authentication
- **Cloudinary** for file uploads
- **Node-cron** for scheduled tasks

## Installation

### Prerequisites
- Node.js (v14 or higher)
- MongoDB (local or Atlas)
- Cloudinary account for media storage

### Backend Setup
1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/chatterpillar.git
   cd chatterpillar
   ```

2. Install backend dependencies:
   ```bash
   cd backend
   npm install
   ```

3. Create a `.env` file in the backend directory with the following variables:
   ```
   PORT=5002
   MONGO_URI=your_mongodb_connection_string
   JWT_SECRET=your_jwt_secret
   CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
   CLOUDINARY_API_KEY=your_cloudinary_api_key
   CLOUDINARY_API_SECRET=your_cloudinary_api_secret
   FRONTEND_URL=http://localhost:5173
   ```

4. Start the backend server:
   ```bash
   npm run dev
   ```

### Frontend Setup
1. Open a new terminal and navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install frontend dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file in the frontend directory:
   ```
   VITE_API_URL=http://localhost:5002/api
   ```

4. Start the frontend development server:
   ```bash
   npm run dev
   ```

5. Open your browser and navigate to `http://localhost:5173`

## Usage

### Authentication
- Register a new account with email and password
- Login with existing credentials
- Update your profile picture and settings

### Messaging
- Select a user from the sidebar to start a direct conversation
- Switch to the Groups tab to join or create group chats
- Use the text input to send messages
- Attach images or documents using the dedicated buttons
- Record voice messages with the microphone button
- Schedule messages by clicking the clock icon

### Polls (Group Chat)
- Click the chart icon in a group chat to create a poll
- Add up to 6 options
- View real-time voting results

### Bookmarks
- Click the bookmark icon on any message to save it for later
- Access your bookmarks from the navigation bar

### Settings
- Change app theme from the Settings page
- View and manage scheduled messages
- Update profile information

## Development

### Project Structure
```
/
├── backend/               # Backend code
│   ├── src/
│   │   ├── controllers/   # Request handlers
│   │   ├── models/        # Database models
│   │   ├── routes/        # API routes
│   │   ├── lib/           # Utilities and helpers
│   │   ├── middleware/    # Express middleware
│   │   └── index.js       # Entry point
│   └── package.json
│
└── frontend/              # Frontend code
    ├── src/
    │   ├── components/    # React components
    │   ├── pages/         # Page components
    │   ├── store/         # Zustand stores
    │   ├── lib/           # Utilities
    │   ├── styles/        # CSS and style files
    │   ├── constants/     # Constants and configs
    │   ├── App.jsx        # Main app component
    │   └── main.jsx       # Entry point
    ├── index.html
    └── package.json
```

### Key Pages
- **HomePage**: Main chat interface with sidebar and messaging area
- **LoginPage/SignUpPage**: Authentication screens
- **ProfilePage**: User profile management
- **SettingsPage**: App settings and theme selection
- **ScheduledMessagesPage**: View and manage scheduled messages
- **HelperPage**: AI-powered chat assistant

## Debugging

The application includes built-in debugging tools:
- Access `/debug` route for server health checks
- View scheduled message status and manually trigger the scheduler
- Check server connections and performance

## Contributing

1. Fork the repository
2. Create your feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Icons by [Lucide](https://lucide.dev/)
- UI components by [DaisyUI](https://daisyui.com/)
- Inspired by modern chat applications