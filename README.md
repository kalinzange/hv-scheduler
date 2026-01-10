# HV Scheduler - Team Scheduling Application

A modern, Firebase-powered team scheduling application built with React, TypeScript, and Vite. This application helps teams manage schedules, track holidays, and coordinate shift planning.

## Features

- 🔐 Role-based access control (Viewer, Editor, Manager, Admin)
- 📅 Interactive schedule management
- 🌐 Multi-language support (EN, DE, IT, FR, PT, TR, ES)
- 🔄 Real-time Firebase synchronization
- 📴 Offline mode with local storage fallback
- 📊 Team statistics and reporting
- 🎨 Modern, responsive UI with Tailwind CSS

## Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Firebase account (for cloud synchronization)

## Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/kalinzange/hv-scheduler.git
cd hv-scheduler
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

Create a `.env` file in the root directory based on `.env.example`:

```bash
cp .env.example .env
```

Edit `.env` and add your Firebase configuration:

```env
# Firebase Configuration
VITE_FIREBASE_API_KEY=your_firebase_api_key_here
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
VITE_FIREBASE_APP_ID=your_app_id

# App Configuration
VITE_APP_ID=your-scheduler-app-id

# Access Configuration (separate emails by comma, no spaces)
VITE_ADMIN_EMAILS=email1@example.com,email2@example.com

# Master Passwords (CHANGE THESE!)
VITE_MANAGER_MASTER_PASS=your_secure_manager_password
VITE_ADMIN_MASTER_PASS=your_secure_admin_password
```

**⚠️ Security Warning:** Never commit your `.env` file to version control. It contains sensitive credentials.

### 4. Run the development server

```bash
npm run dev
```

The application will be available at `http://localhost:5173`

## Building for Production

```bash
npm run build
```

The production build will be available in the `dist/` directory.

## Deployment

### GitHub Pages

1. Update the `homepage` field in `package.json` to match your GitHub Pages URL:
   ```json
   "homepage": "https://yourusername.github.io/hv-scheduler"
   ```

2. Build and deploy:
   ```bash
   npm run build
   # Use gh-pages or your preferred deployment method
   ```

3. Configure environment variables in your hosting platform:
   - For GitHub Pages, you can use GitHub Secrets and Actions
   - Ensure all `VITE_*` environment variables are set

### Firebase Setup

1. Create a Firebase project at https://console.firebase.google.com
2. Enable Firestore Database
3. Enable Anonymous Authentication
4. Set up Firestore Security Rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /artifacts/{appId}/public/data/{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

## Project Structure

```
hv-scheduler/
├── src/
│   ├── components/       # React components
│   ├── config/          # Configuration files (constants, Firebase)
│   ├── types/           # TypeScript type definitions
│   └── utils/           # Utility functions (translations, etc.)
├── public/              # Static assets
├── .env.example         # Example environment variables
└── package.json         # Project dependencies
```

## Security Considerations

- Always use environment variables for sensitive data
- Change default passwords immediately after setup
- Review and restrict Firebase security rules for production
- Enable password hashing for all users
- Regularly update dependencies

## Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run lint` - Run ESLint
- `npm run preview` - Preview production build

### Customization

1. **Team Data**: Update `src/config/constants.ts` to customize initial team structure
2. **Languages**: Modify language options in `INITIAL_TEAM` array
3. **Holidays**: Update `DEFAULT_HOLIDAYS` array with your organization's holidays
4. **Styling**: Tailwind CSS classes can be customized in component files

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is open source and available under the MIT License.

## Support

For issues, questions, or contributions, please open an issue on GitHub.
