# Faithful Mods

### Prerequisites

- Node **18**
- Docker

### Project setup

```shell
# install dependencies
npm ci
# to setup conventional commits
npm run prepare
```

### Setup .env file

```properties
# local/prod postgres database url
DATABASE_URL= postgres_url
DIRECT_URL= postgres_url + &pgbouncer=true&connect_timeout=15

# openssl rand -base64 32
AUTH_SECRET=
NEXT_PUBLIC_APP_URL="http://localhost:3000"

# Github OAuth credentials, create a new OAuth app at
# https://github.com/settings/developers
GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=
```

### Setup Prisma
```shell
# generate prisma client types
npx prisma generate
# update the database (create tables, columns, etc)
npx prisma db push
```

### Start the app

```shell
npm run dev
```
