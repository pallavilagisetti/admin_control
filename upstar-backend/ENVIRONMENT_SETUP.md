# Environment Configuration

This project uses a single unified environment file: `env.local`

## Quick Setup

1. **Copy the environment file:**
   ```bash
   cp env.local env.local.backup  # Backup the template
   ```

2. **Edit the configuration:**
   ```bash
   nano env.local  # or use your preferred editor
   ```

3. **Update the required values:**
   - Database credentials
   - JWT secrets
   - API keys
   - Other service configurations

## Environment Variables

### Required Variables
- `DB_HOST` - Database host (default: localhost)
- `DB_PORT` - Database port (default: 5432)
- `DB_NAME` - Database name (must be: resume_db)
- `DB_USER` - Database username
- `DB_PASSWORD` - Database password
- `JWT_SECRET` - JWT signing secret
- `SESSION_SECRET` - Session secret

### Optional Variables
- `NODE_ENV` - Environment (development/production)
- `PORT` - Server port (default: 5000)
- `CORS_ORIGIN` - Frontend URL for CORS
- `AWS_ACCESS_KEY_ID` - AWS credentials (if using S3)
- `OPENAI_API_KEY` - OpenAI API key (if using AI features)

## Production Deployment

For production, uncomment and modify the production overrides section in `env.local`:

```env
# Production Overrides
NODE_ENV=production
DB_HOST=your-production-db-host
DB_USER=your-production-db-user
DB_PASSWORD=your-secure-production-password
CORS_ORIGIN=https://your-domain.com
JWT_SECRET=your-super-secure-jwt-secret-for-production
```

## Security Notes

- **Never commit `env.local` to version control**
- **Change all default secrets in production**
- **Use strong, unique passwords**
- **Rotate secrets regularly**

## Troubleshooting

If you encounter issues:

1. **Check file exists:** `ls -la env.local`
2. **Verify permissions:** `chmod 600 env.local`
3. **Test database connection:** `npm run test:db`
4. **Check logs:** `npm run logs`

## Migration from Old Setup

If you were using `env.production` or `env.example`:

1. ✅ **Old files removed** - `env.production` and `env.example` deleted
2. ✅ **New file created** - `env.local` contains all configurations
3. ✅ **References updated** - All scripts now use `env.local`
4. ✅ **Documentation updated** - All docs reference the new file

Your old environment variables are preserved in the new `env.local` file.





