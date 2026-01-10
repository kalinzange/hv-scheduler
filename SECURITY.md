# Security Policy

## Reporting Security Vulnerabilities

If you discover a security vulnerability in this project, please report it by:

1. **Do NOT** open a public issue
2. Email the repository maintainers directly
3. Include detailed information about the vulnerability
4. Allow reasonable time for the issue to be addressed before public disclosure

## Security Best Practices

### For Administrators

1. **Password Management**
   - Use strong, unique passwords for all admin and manager accounts
   - Change default passwords immediately upon deployment
   - Rotate passwords regularly (recommended: every 90 days)
   - Never share passwords via email or insecure channels

2. **Environment Variables**
   - Never commit `.env` files to the repository
   - Store Firebase credentials securely
   - Use GitHub Secrets for CI/CD deployments
   - Regularly audit and rotate API keys

3. **Firebase Security**
   - Review and update Firestore security rules regularly
   - Enable Firebase Authentication logs
   - Monitor for suspicious activity
   - Set up alerts for unusual access patterns

4. **Access Control**
   - Follow the principle of least privilege
   - Regularly review user permissions
   - Remove access for users who no longer need it
   - Use role-based access control appropriately

### For Developers

1. **Code Security**
   - Never hardcode credentials in source code
   - Always use environment variables for sensitive data
   - Sanitize all user inputs
   - Keep dependencies up to date

2. **Authentication**
   - All passwords are hashed using bcryptjs (cost factor: 10)
   - Rate limiting is enforced on authentication endpoints
   - Session tokens expire after inactivity

3. **Data Protection**
   - All sensitive data is encrypted in transit (HTTPS)
   - Firestore security rules enforce access control
   - Audit logs track all data modifications

## Security Features

### Implemented Protections

- ✅ Password hashing with bcryptjs
- ✅ Rate limiting on login attempts (5 attempts per 15 minutes)
- ✅ Role-based access control (RBAC)
- ✅ Firestore security rules
- ✅ Secure environment variable management
- ✅ HTTPS-only connections
- ✅ Input validation and sanitization
- ✅ Audit logging for compliance

### Known Limitations

- Rate limiting is in-memory and resets on Cloud Function cold starts
- For production use, consider implementing:
  - Redis-based rate limiting
  - Multi-factor authentication (MFA)
  - IP whitelisting for admin access
  - Regular security audits
  - Automated vulnerability scanning

## Compliance

This application handles sensitive employee data. Ensure compliance with:

- GDPR (General Data Protection Regulation)
- Local labor laws regarding employee data
- Your organization's data protection policies

### Data Retention

- Review and implement appropriate data retention policies
- Regularly backup critical data
- Have a disaster recovery plan in place

## Updates and Patches

- Monitor GitHub Security Advisories
- Keep all dependencies up to date
- Subscribe to Firebase security announcements
- Test security updates in a staging environment before production

## Security Checklist for Deployment

Before making this repository public or deploying to production:

- [ ] All default passwords have been changed
- [ ] `.env` file is not committed to repository
- [ ] Firebase security rules are properly configured
- [ ] HTTPS is enforced for all connections
- [ ] Rate limiting is tested and working
- [ ] All dependencies are up to date
- [ ] Security headers are properly configured
- [ ] Audit logging is enabled and monitored
- [ ] Backup procedures are in place
- [ ] Access control lists are reviewed
- [ ] Security documentation is up to date

## Resources

- [Firebase Security Rules](https://firebase.google.com/docs/firestore/security/get-started)
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Node.js Security Best Practices](https://nodejs.org/en/docs/guides/security/)
- [React Security Best Practices](https://reactjs.org/docs/security.html)

---

**Last Updated**: January 2026
