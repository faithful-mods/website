# Faithful Mods

## Prerequisites

- Node **18**
- Docker

## Project installation

### Clone the repository

```shell
git clone "https://github.com/Juknum/faithful-mods"
cd ./faithful-mods

# install dependencies
npm ci
# to setup conventional commits
npm run prepare
```

### Setup .env file

```properties
# local/prod postgres database url
DATABASE_URL="postgresql://postgres:postgres@localhost:5555/fm_postgres?schema=public"

# openssl rand -base64 32
AUTH_SECRET=

NEXT_PUBLIC_APP_URL="http://localhost:3000"

# Github OAuth credentials, create a new OAuth app at
# https://github.com/settings/developers
GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=
```

### Setup the database

Download docker and run the following command to start a postgres database

```shell
docker compose up -d --force-recreate
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
