# Development Setup

## Prerequisites

- Node.js 16+
- PHP 8.1+
- Composer
- Docker (for DDev)

## Local Development with DDev

### Starting the Environment

```bash
# 1. Start DDev (run from drupal directory)
cd drupal
ddev start

# 2. Install the site (creates database, imports config)
ddev install

# 3. Verify Drupal is running
ddev drush status

# 4. Start the frontend (backend must be running first)
cd ../nuxt
yarn install
yarn dev

# Access at http://stuartclark.ddev.site
```

## Common Commands

> **Note**: All DDev commands must be run from the `drupal` directory.

### Frontend (from nuxt/)

| Command | Description |
|---------|-------------|
| `yarn dev` | Start dev server |
| `yarn build` | Build for production |
| `yarn generate` | Generate static site |
| `yarn lint` | Run all linters |
| `yarn test` | Run all tests |
| `yarn storybook` | Start Storybook |

### DDev (from drupal/)

| Command | Description |
|---------|-------------|
| `ddev start` | Start the environment |
| `ddev stop` | Stop the environment |
| `ddev install` | Initialize site (database, config) |
| `ddev drush uli` | Get login one-time URL |
| `ddev drush cr` | Clear cache |
| `ddev drush updb` | Run database updates |
| `ddev drush cim` | Import config |

## Troubleshooting

### Frontend Issues

**Module not found errors**

```bash
# Clear node_modules and reinstall
rm -rf node_modules
yarn install
```

**Port already in use**

```bash
# Kill process on port 3000
lsof -ti:3000 | xargs kill -9
```

### Backend Issues

**Database connection failed**

```bash
# Restart database
ddev restart
```

**Missing configuration**

```bash
# Import config
ddev drush cim -y
```
