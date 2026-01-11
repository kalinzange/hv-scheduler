# HV Scheduler - Team Shift Management Application

A modern, web-based shift scheduling application built with React, TypeScript, and Firebase. Designed for managing team schedules with role-based access control, real-time synchronization, and comprehensive security features.

## Features

- 📅 **Visual Shift Planning** - Intuitive calendar-based interface for managing team schedules
- 👥 **Role-Based Access Control** - Multiple user roles (Viewer, Editor, Manager, Admin) with specific permissions
- 🔐 **Secure Authentication** - Password-protected access with bcrypt hashing and rate limiting
- 🌍 **Multi-Language Support** - Built-in support for multiple languages
- 📊 **Statistics & Reporting** - Comprehensive reporting on shifts, hours, and coverage
- 🔄 **Real-time Sync** - Firebase-powered real-time data synchronization
- 📱 **Responsive Design** - Works on desktop, tablet, and mobile devices
- 🎨 **Customizable** - Configurable shifts, colors, and business rules

## Tech Stack

- **Frontend**: React 19, TypeScript, Vite
- **Styling**: Tailwind CSS
- **Backend**: Firebase (Firestore, Cloud Functions, Authentication)
- **Security**: bcryptjs for password hashing, rate limiting
- **Icons**: Lucide React

## Getting Started

### Prerequisites

- Node.js 20.x or higher
- npm or yarn
- Firebase project (for backend services)

### Installation

1. Clone the repository:

```bash
git clone https://github.com/kalinzange/hv-scheduler.git
cd hv-scheduler
```

2. Install dependencies:

```bash
npm install
```

3. Create a `.env` file based on `.env.example`:

```bash
cp .env.example .env
```

4. Configure your Firebase credentials in the `.env` file:

```env
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_APP_ID=your_app_identifier
```

5. Start the development server:

```bash
npm run dev
```

### Firebase Setup

**Complete setup guide:** See [FIREBASE_FUNCTIONS_SUMMARY.md](FIREBASE_FUNCTIONS_SUMMARY.md) for overview or [FIREBASE_DEPLOYMENT_CHECKLIST.md](FIREBASE_DEPLOYMENT_CHECKLIST.md) for step-by-step instructions.

**Quick Start:**

1. Generate password hashes:

```bash
cd functions
npm install
node generate-hashes.js "YourManagerPassword" "YourAdminPassword"
```

2. Set Firebase secrets:

```bash
firebase functions:secrets:set MANAGER_PASS_HASH
firebase functions:secrets:set ADMIN_PASS_HASH
```

3. Deploy Firestore security rules:

```bash
firebase deploy --only firestore:rules
```

4. Deploy Cloud Functions:

```bash
firebase deploy --only functions
```

5. Update environment variables:
   - Add `VITE_CLOUD_FUNCTION_URL` to `.env.local` for local development
   - Add `VITE_CLOUD_FUNCTION_URL` to GitHub Secrets for production

**Documentation:**

- [FIREBASE_FUNCTIONS_SUMMARY.md](FIREBASE_FUNCTIONS_SUMMARY.md) - Overview and architecture
- [FIREBASE_DEPLOYMENT_CHECKLIST.md](FIREBASE_DEPLOYMENT_CHECKLIST.md) - Complete deployment checklist
- [FIREBASE_FUNCTIONS_SETUP.md](FIREBASE_FUNCTIONS_SETUP.md) - Detailed setup guide
- [FIREBASE_QUICK_REFERENCE.md](FIREBASE_QUICK_REFERENCE.md) - Quick command reference

## User Roles

- **Viewer**: Read-only access to view schedules
- **Editor**: Can edit their own schedule entries
- **Manager**: Full access to manage all schedules and approve requests
- **Admin**: System administration access for user management

## Security Features

- Password hashing using bcryptjs
- Rate limiting on authentication endpoints
- Role-based access control
- Secure environment variable management
- Firestore security rules
- Audit logging for compliance

## Configuration

The application can be configured through the settings panel (Admin/Manager access required):

- Shift patterns and rotation cycles
- Holiday management
- Minimum staff requirements
- Required languages for coverage
- Weekend definitions
- Custom shift types and colors

## Development

### Project Structure

```
hv-scheduler/
├── src/
│   ├── components/     # React components
│   ├── config/         # Configuration files
│   ├── types/          # TypeScript type definitions
│   └── utils/          # Utility functions
├── functions/          # Firebase Cloud Functions
│   └── src/
├── firestore.rules     # Firestore security rules
└── public/             # Static assets
```

### Build for Production

```bash
npm run build
```

### Linting

```bash
npm run lint
```

## Deployment

The application is configured for GitHub Pages deployment via GitHub Actions. The workflow automatically builds and deploys on push to the main branch.

See `.github/workflows/deploy.yml` for deployment configuration.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is private and proprietary.

## Support

For questions or issues, please open an issue on GitHub.

---

**Note**: This application handles sensitive employee data. Ensure proper security measures are in place before deploying to production, including:

- Strong password policies
- Regular security audits
- Proper Firebase security rules
- Environment variable protection
- Regular backups
