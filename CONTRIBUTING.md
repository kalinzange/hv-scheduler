# Contributing to HV Scheduler

Thank you for your interest in contributing to HV Scheduler! This document provides guidelines and instructions for contributing to this project.

## Code of Conduct

This project follows standard open-source community guidelines. Please be respectful and constructive in all interactions.

## How to Contribute

### Reporting Issues

If you find a bug or have a suggestion:

1. **Search existing issues** to avoid duplicates
2. **Use issue templates** if available
3. **Provide detailed information**:
   - Steps to reproduce the issue
   - Expected behavior vs actual behavior
   - Environment details (browser, OS, Node version)
   - Screenshots if applicable

### Security Vulnerabilities

**Do not open public issues for security vulnerabilities.** See [SECURITY.md](SECURITY.md) for reporting procedures.

### Suggesting Features

Feature requests are welcome! Please:

1. Check if the feature has already been requested
2. Clearly describe the feature and its use case
3. Explain why it would be valuable
4. Consider if it fits the project's scope

## Development Setup

### Prerequisites

- Node.js 20.x or higher
- npm or yarn
- Git
- Firebase account (for backend testing)

### Local Setup

1. **Fork and clone the repository**:
   ```bash
   git clone https://github.com/YOUR_USERNAME/hv-scheduler.git
   cd hv-scheduler
   ```

2. **Install dependencies**:
   ```bash
   npm install
   cd functions
   npm install
   cd ..
   ```

3. **Set up environment variables**:
   ```bash
   cp .env.example .env
   # Edit .env with your Firebase credentials
   ```

4. **Start development server**:
   ```bash
   npm run dev
   ```

### Project Structure

```
hv-scheduler/
├── src/               # Frontend source code
│   ├── components/    # React components
│   ├── config/        # Configuration
│   ├── types/         # TypeScript types
│   └── utils/         # Utility functions
├── functions/         # Firebase Cloud Functions
│   └── src/
├── public/           # Static assets
└── firestore.rules   # Database security rules
```

## Making Changes

### Branching Strategy

- `main` - Production-ready code
- `develop` - Integration branch (if used)
- `feature/*` - New features
- `fix/*` - Bug fixes
- `docs/*` - Documentation updates

### Commit Messages

Follow conventional commit format:

```
type(scope): subject

body (optional)

footer (optional)
```

**Types**:
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

**Examples**:
```
feat(auth): add two-factor authentication
fix(schedule): correct shift overlap calculation
docs(readme): update installation instructions
```

### Code Style

- **TypeScript**: Use strict type checking
- **React**: Functional components with hooks
- **Formatting**: Use Prettier (if configured)
- **Linting**: Run `npm run lint` before committing

### Testing

Before submitting a pull request:

```bash
# Lint code
npm run lint

# Build project
npm run build

# Test in browser
npm run dev
# Then manually test your changes
```

## Pull Request Process

1. **Create a feature branch**:
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make your changes**:
   - Write clean, documented code
   - Follow existing patterns
   - Update documentation if needed

3. **Test thoroughly**:
   - Test in multiple browsers if UI changes
   - Verify no console errors
   - Test edge cases

4. **Commit your changes**:
   ```bash
   git add .
   git commit -m "feat: add your feature"
   ```

5. **Push to your fork**:
   ```bash
   git push origin feature/your-feature-name
   ```

6. **Open a Pull Request**:
   - Use a clear title
   - Reference any related issues
   - Describe what changed and why
   - Add screenshots for UI changes
   - List any breaking changes

### PR Review Process

- Maintainers will review your PR
- Address any requested changes
- Once approved, your PR will be merged
- Your contribution will be acknowledged

## Development Guidelines

### Security

- Never commit credentials or secrets
- Use environment variables for configuration
- Follow security best practices
- Test authentication and authorization

### Performance

- Minimize bundle size
- Optimize images
- Avoid unnecessary re-renders
- Use code splitting when appropriate

### Accessibility

- Use semantic HTML
- Provide alt text for images
- Ensure keyboard navigation works
- Test with screen readers when possible

### Browser Support

- Test in Chrome, Firefox, Safari, Edge
- Support modern evergreen browsers
- Use polyfills if targeting older browsers

## Firebase Development

### Firestore Rules

When modifying `firestore.rules`:

1. Test rules in Firebase Console simulator
2. Document any changes
3. Ensure backward compatibility
4. Consider security implications

### Cloud Functions

When modifying `functions/`:

1. Test locally with Firebase emulator
2. Update TypeScript types
3. Handle errors properly
4. Add appropriate logging
5. Consider cold start performance

## Documentation

Good documentation is crucial:

- **Code Comments**: Explain "why", not just "what"
- **README Updates**: Keep installation/setup current
- **API Documentation**: Document public interfaces
- **Changelog**: Note breaking changes

## Questions?

- Open a GitHub Discussion
- Check existing documentation
- Review closed issues/PRs

## License

By contributing, you agree that your contributions will be licensed under the same license as the project.

---

Thank you for contributing! 🎉
