# CI/CD Guide for Farm Scheduler

This document explains the GitHub Actions workflows set up for this project and how to use them.

## Overview

The project uses 4 GitHub Actions workflows to automate testing, deployment, dependency management, and code quality checks.

## Workflows

### 1. CI - Continuous Integration (`ci.yml`)

**Triggers:**
- Push to `main` or `develop` branches
- Pull requests to `main` or `develop` branches

**What it does:**
- Tests the application on Node.js versions 18.x, 20.x, and 22.x
- Runs security vulnerability scans with `npm audit`
- Validates JavaScript syntax
- Checks for required files
- Validates HTML structure
- Ensures sensitive files (.env, service-account.json) are not committed
- Validates all JSON files
- Scans for TODO comments

**Jobs:**
1. **Test** - Multi-version Node.js testing and validation
2. **Lint** - Code quality and security checks
3. **Security** - Security scanning and secret detection
4. **Build Status** - Summary of all checks

### 2. CD - Deploy to Production (`deploy.yml`)

**Triggers:**
- Push to `main` branch
- Git tags starting with `v*` (e.g., v1.0.0)
- Manual workflow dispatch

**What it does:**
- Creates deployment packages for releases
- Generates GitHub Releases with deployment instructions
- Builds Docker images and docker-compose configuration
- Validates deployment packages
- Sends deployment notifications

**Jobs:**
1. **Prepare Release** - Creates release package and GitHub Release
2. **Deploy Docker** - Builds Docker configuration files
3. **Validate Deployment** - Tests deployment package
4. **Notify** - Creates deployment summary

**How to create a release:**
```bash
# Tag your commit
git tag v1.0.0
git push origin v1.0.0

# The workflow will automatically:
# - Create a release package
# - Generate deployment instructions
# - Create a GitHub Release
# - Build Docker files
```

### 3. Dependency Update Check (`dependency-update.yml`)

**Triggers:**
- Every Monday at 9:00 AM UTC (scheduled)
- Manual workflow dispatch

**What it does:**
- Checks for outdated npm packages
- Runs security audits
- Automatically updates patch versions
- Creates pull requests for dependency updates

**Jobs:**
1. **Check Updates** - Scans for outdated dependencies
2. **Auto-update Dependencies** - Creates PR for patch updates

**Output:**
- Visual report of outdated packages
- Security vulnerability summary
- Automatic PR for safe updates

### 4. Code Quality (`code-quality.yml`)

**Triggers:**
- Pull requests to `main` or `develop`
- Push to `main` branch

**What it does:**
- Analyzes code statistics (lines of code, file counts)
- Checks for console.log statements
- Analyzes error handling coverage
- Measures documentation coverage
- Monitors file sizes
- Extracts and documents API endpoints
- Analyzes dependency footprint

**Jobs:**
1. **Analyze** - Code statistics and quality metrics
2. **File Size Check** - Monitors large files
3. **API Documentation** - Extracts API routes
4. **Dependency Graph** - Analyzes dependencies

## Workflow Status Badges

Add these badges to your README.md to show workflow status:

```markdown
![CI](https://github.com/ahmadnugroho-asp/farm-scheduler/actions/workflows/ci.yml/badge.svg)
![Code Quality](https://github.com/ahmadnugroho-asp/farm-scheduler/actions/workflows/code-quality.yml/badge.svg)
![Deploy](https://github.com/ahmadnugroho-asp/farm-scheduler/actions/workflows/deploy.yml/badge.svg)
```

## How to Use

### Running Workflows Manually

You can trigger workflows manually from the GitHub Actions tab:

1. Go to your repository on GitHub
2. Click "Actions" tab
3. Select the workflow you want to run
4. Click "Run workflow"
5. Choose branch and parameters (if applicable)

### Viewing Workflow Results

1. Go to "Actions" tab in your repository
2. Click on any workflow run to see details
3. Click on individual jobs to see logs
4. Check the summary for reports and statistics

### Creating a Release

To create a production release:

```bash
# 1. Update version in package.json
cd server
npm version patch  # or minor, or major

# 2. Commit the version change
git add package.json package-lock.json
git commit -m "chore: bump version to v1.0.1"

# 3. Create and push tag
git tag v1.0.1
git push origin main --tags

# 4. The deploy workflow will automatically:
#    - Create a release package
#    - Generate GitHub Release with notes
#    - Build Docker configuration
#    - Create deployment instructions
```

### Debugging Failed Workflows

If a workflow fails:

1. **Check the logs:**
   - Click on the failed workflow run
   - Click on the failed job
   - Review the step that failed

2. **Common issues:**
   - **npm audit failures:** Check for security vulnerabilities
   - **Syntax errors:** Run `node --check server.js` locally
   - **Missing files:** Ensure all required files are committed
   - **Test failures:** Run tests locally before pushing

3. **Re-run workflows:**
   - Click "Re-run jobs" button in the workflow run
   - Or push a new commit to trigger workflows again

## Best Practices

### For Developers

1. **Before pushing:**
   ```bash
   # Check syntax
   cd server && node --check server.js

   # Check for security issues
   npm audit

   # Validate JSON files
   npm install -g jsonlint
   jsonlint package.json
   ```

2. **For pull requests:**
   - Ensure all CI checks pass
   - Review the code quality report
   - Address any security vulnerabilities
   - Update documentation if needed

3. **For releases:**
   - Follow semantic versioning (MAJOR.MINOR.PATCH)
   - Update CHANGELOG if you have one
   - Test thoroughly before tagging
   - Write clear release notes

### Security

- **Never commit sensitive files:** .env, service-account.json
- **Review dependency updates:** Check changelog before merging
- **Monitor security alerts:** GitHub will create issues for vulnerabilities
- **Keep dependencies updated:** Review weekly dependency reports

## Customization

### Changing Node.js Versions

Edit `.github/workflows/ci.yml`:
```yaml
strategy:
  matrix:
    node-version: [18.x, 20.x, 22.x]  # Modify these versions
```

### Changing Dependency Check Schedule

Edit `.github/workflows/dependency-update.yml`:
```yaml
on:
  schedule:
    - cron: '0 9 * * 1'  # Change schedule here
```

### Adding Custom Checks

Add new steps to any workflow:
```yaml
- name: Custom Check
  run: |
    echo "Running custom check"
    # Your commands here
```

## Monitoring

### Workflow Run History

View all workflow runs:
```bash
gh run list --limit 20
```

### View Specific Run

```bash
gh run view <run-id>
```

### Watch a Running Workflow

```bash
gh run watch
```

## Troubleshooting

### Workflow Not Triggering

Check:
- Branch protection rules
- Workflow file syntax (YAML)
- Trigger conditions match your event

### Permission Errors

Ensure GitHub token has required permissions:
- workflow scope for workflow files
- write access for creating releases

### Failed npm audit

If npm audit fails due to vulnerabilities:
1. Review the vulnerabilities
2. Update affected packages: `npm update`
3. For unfixable issues, use `npm audit fix --force` (carefully)
4. Or add `continue-on-error: true` to the step (not recommended)

## Additional Resources

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Workflow Syntax](https://docs.github.com/en/actions/reference/workflow-syntax-for-github-actions)
- [GitHub CLI](https://cli.github.com/)

## Support

For issues with workflows:
1. Check workflow logs in GitHub Actions tab
2. Review this guide
3. Create an issue in the repository
