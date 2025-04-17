# Instagram Automation Tool
A JavaScript-based Instagram automation tool with user authentication, admin panel, and dark theme UI.
A JavaScript-based Instagram automation API with user authentication, admin panel, and comprehensive automation features.
![Instagram Automation](https://img.shields.io/badge/Instagram-Automation-blue)
![JavaScript](https://img.shields.io/badge/JavaScript-ES6-yellow)
![Node.js](https://img.shields.io/badge/Node.js-v16+-green)
![Express](https://img.shields.io/badge/Express-v4-lightgrey)
## Features
- User authentication (register/login)
- Admin panel for user management
- Instagram account management
- Cookie storage for Instagram sessions
- Automation features:
- **User Authentication System**
  - Register and login functionality
  - Secure password hashing with scrypt
  - Session management
- **Admin Panel**
  - User management
  - Account overview
  - Admin-only protected routes
- **Instagram Account Management**
  - Add/remove Instagram accounts
  - Store and manage authentication cookies
  - Track account activity
- **Automation Features**
  - Follow/unfollow users
  - Like/unlike posts
  - Comment on posts/delete comments
  - Comment on posts
  - Delete comments
  - Retrieve profile information
  - Automated duplicate account cleanup
## Deployment to Render.com
- **Activity Tracking**
  - Comprehensive logging
  - Success/failure tracking
  - Historical data
## Getting Started
### Prerequisites
- A Render.com account
- Git repository with this code
- Node.js (v16 or newer)
- npm (v7 or newer)
### Deployment Steps
### Installation
1. **Prepare your repository**
   - Make sure all files are committed to your Git repository
   - Your repository should include:
     - server.js
     - instagram-automation.js
     - automation-routes.js
     - package-render.json (rename to package.json before deploying)
1. Clone the repository:
   ```bash
   git clone https://github.com/YOUR-USERNAME/instagram-automation-tool.git
   cd instagram-automation-tool
   ```
2. **Create a Web Service on Render**
   - Log in to your Render.com account
   - Click on "New +" and select "Web Service"
   - Connect your Git repository
   - Configure the service:
     - Name: Choose a name for your app
     - Environment: Node
     - Build Command: `npm install`
     - Start Command: `npm start`
2. Install dependencies:
   ```bash
   cp package-render.json package.json
   npm install
   ```
3. **Set Environment Variables**
   - Add the following environment variables in the Render dashboard:
     - `NODE_ENV`: Set to `production`
     - `SESSION_SECRET`: Set to a strong random string
     - `PORT`: Render will set this automatically
3. Start the server:
   ```bash
   node server.js
   ```
4. **Deploy the Service**
   - Click "Create Web Service"
   - Render will automatically build and deploy your application
4. The server will run on http://localhost:3000 by default
5. **Access Your Application**
   - Once deployed, you can access your application at the URL provided by Render
   - Default admin credentials: username `david`, password `david@@@`
### Default Admin Credentials
## Local Development
- Username: `david`
- Password: `david@@@`
1. Rename package-render.json to package.json
2. Install dependencies: `npm install`
3. Start the development server: `npm run dev`
## Deployment
## API Endpoints
### Deploy to Render.com
### Authentication
- `POST /api/register` - Register a new user
- `POST /api/login` - Log in a user
- `POST /api/logout` - Log out a user
- `GET /api/user` - Get the current user
1. Sign up for a [Render.com](https://render.com) account
2. Create a new Web Service
3. Connect your GitHub repository
4. Configure the service:
   - Environment: Node
   - Build Command: `npm install`
   - Start Command: `npm start`
   - Environment Variables:
     - `NODE_ENV`: `production`
     - `SESSION_SECRET`: (generate a strong random string)
### Instagram Accounts
- `GET /api/instagram/accounts` - Get all Instagram accounts for the current user
- `POST /api/instagram/accounts` - Add a new Instagram account
- `DELETE /api/instagram/accounts/:id` - Delete an Instagram account
## API Documentation
### Cookies
- `GET /api/instagram/cookies` - Get all cookies for the current user
- `POST /api/instagram/cookies` - Add a new cookie
- `DELETE /api/instagram/cookies/:id` - Delete a cookie
### Authentication Endpoints
### Activity Logs
- `GET /api/activity-logs` - Get activity logs for the current user
- **POST /api/register** - Register a new user
  ```json
  {
    "username": "testuser",
    "email": "test@example.com",
    "password": "password123"
  }
  ```
### Automation
- `POST /api/automation/run` - Run an automation task
- **POST /api/login** - Log in a user
  ```json
  {
    "username": "testuser",
    "password": "password123"
  }
  ```
### Admin
- `GET /api/admin/users` - Get all users (admin only)
- `DELETE /api/admin/users/:id` - Delete a user (admin only)
- **POST /api/logout** - Log out a user
- **GET /api/user** - Get the current user
### Instagram Account Endpoints
- **GET /api/instagram/accounts** - Get all Instagram accounts for the current user
- **POST /api/instagram/accounts** - Add a new Instagram account
  ```json
  {
    "email": "instagram@example.com",
    "password": "instagrampassword"
  }
  ```
- **DELETE /api/instagram/accounts/:id** - Delete an Instagram account
### Cookies Endpoints
- **GET /api/instagram/cookies** - Get all cookies for the current user
- **POST /api/instagram/cookies** - Add a new cookie
  ```json
  {
    "accountId": "1",
    "cookieValue": "your-cookie-string-here"
  }
  ```
- **DELETE /api/instagram/cookies/:id** - Delete a cookie
### Activity Log Endpoints
- **GET /api/activity-logs** - Get activity logs for the current user
### Automation Endpoints
- **POST /api/automation/run** - Run an automation task
  ```json
  {
    "type": "follow",
    "username": "target_username"
  }
  ```
### Admin Endpoints
- **GET /api/admin/users** - Get all users (admin only)
- **DELETE /api/admin/users/:id** - Delete a user (admin only)
## Security Notes
- This application uses secure password hashing with scrypt
- Sessions are stored in memory (for production, consider using a database session store)
- Admin privileges are restricted to pre-configured admin accounts
## Contributing
1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request
## License
This project is licensed under the MIT License - see the LICENSE file for details.
