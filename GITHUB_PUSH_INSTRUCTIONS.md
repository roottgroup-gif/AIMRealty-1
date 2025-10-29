# Push Code to GitHub

## Quick Push to https://github.com/roottgroup-gif/AIMRealty-1

You're currently on your VPS at `/var/www/mapestate.net`. Here's how to push your latest code to GitHub:

---

## Option 1: Automated Push (Easiest)

### Run the push script:

```bash
cd /var/www/mapestate.net
chmod +x push-to-github.sh
./push-to-github.sh
```

The script will:
1. Check git status
2. Add all changes
3. Create a commit with timestamp
4. Push to GitHub

---

## Option 2: Manual Push

### Step 1: Check current status

```bash
cd /var/www/mapestate.net
git status
```

### Step 2: Add changes

```bash
# Add all changes
git add .

# Or add specific files
git add deploy-to-vps.sh DEPLOYMENT_INSTRUCTIONS.md
```

### Step 3: Commit changes

```bash
git commit -m "Update MapEstate - MySQL integration and deployment improvements"
```

### Step 4: Push to GitHub

```bash
# Push to main branch
git push origin main

# Or push to current branch
git push origin $(git branch --show-current)
```

---

## Important Files to Include

Make sure these new files are committed:

- ✅ `deploy-to-vps.sh` - VPS deployment script
- ✅ `DEPLOYMENT_INSTRUCTIONS.md` - Deployment guide
- ✅ `push-to-github.sh` - GitHub push script
- ✅ `server/config/dbConfig.ts` - MySQL configuration
- ✅ `server/storageFactory.ts` - Database connection logic

---

## Files to EXCLUDE (.gitignore)

Make sure these are NOT committed:

- ❌ `.env` - **NEVER commit this!** Contains sensitive credentials
- ❌ `node_modules/` - Dependencies (too large)
- ❌ `dist/` - Build output (generated)
- ❌ `server/uploads/` - User uploaded files (too large)
- ❌ `*.log` - Log files

---

## Check .gitignore

Verify your `.gitignore` includes:

```bash
cat .gitignore
```

Should include:
```
.env
node_modules/
dist/
server/uploads/
*.log
.DS_Store
```

If missing, create/update it:

```bash
cat > .gitignore << 'EOF'
# Environment variables - NEVER COMMIT
.env
.env.local
.env.production

# Dependencies
node_modules/

# Build output
dist/
build/

# Uploads (user content - too large for git)
server/uploads/

# Logs
*.log
npm-debug.log*
logs/

# OS files
.DS_Store
Thumbs.db

# IDE
.vscode/
.idea/
EOF
```

---

## GitHub Authentication

If you get authentication errors when pushing:

### Option 1: Personal Access Token (Recommended)

1. Create token at: https://github.com/settings/tokens
2. Generate new token (classic)
3. Select scopes: `repo` (all repository permissions)
4. Copy the token

When pushing:
```bash
git push origin main
# Username: your-github-username
# Password: paste-your-personal-access-token
```

### Option 2: SSH Key

1. Generate SSH key:
```bash
ssh-keygen -t ed25519 -C "your_email@example.com"
```

2. Add to GitHub:
```bash
cat ~/.ssh/id_ed25519.pub
# Copy and add to https://github.com/settings/keys
```

3. Update remote URL:
```bash
git remote set-url origin git@github.com:roottgroup-gif/AIMRealty-1.git
```

---

## Verify Push Succeeded

After pushing, verify on GitHub:

1. Visit: https://github.com/roottgroup-gif/AIMRealty-1
2. Check the latest commit shows your changes
3. Verify commit timestamp is recent

Or check from command line:
```bash
git log origin/main --oneline -5
```

---

## Common Issues

### Problem: "Permission denied"

**Solution:** Check authentication (see GitHub Authentication above)

### Problem: "Updates were rejected"

**Solution:** Pull first, then push:
```bash
git pull origin main --rebase
git push origin main
```

### Problem: "fatal: not a git repository"

**Solution:** Initialize git:
```bash
git init
git remote add origin https://github.com/roottgroup-gif/AIMRealty-1.git
```

### Problem: ".env file was committed by mistake"

**Solution:** Remove from git (but keep local file):
```bash
git rm --cached .env
echo ".env" >> .gitignore
git commit -m "Remove .env from git"
git push origin main
```

---

## Best Practices

1. **Never commit sensitive data:**
   - ❌ `.env` files
   - ❌ Database passwords
   - ❌ API keys
   - ❌ Session secrets

2. **Always check before committing:**
   ```bash
   git status
   git diff
   ```

3. **Use meaningful commit messages:**
   ```bash
   git commit -m "Add MySQL connection support"
   # Not: git commit -m "update"
   ```

4. **Keep commits focused:**
   - One feature per commit
   - Related changes together

---

## Quick Reference

```bash
# Check status
git status

# Add changes
git add .

# Commit
git commit -m "Your message here"

# Push
git push origin main

# Pull latest
git pull origin main

# View recent commits
git log --oneline -10

# View changes before committing
git diff

# Undo last commit (keep changes)
git reset --soft HEAD~1
```

---

**Ready to push your code to GitHub!** 🚀
