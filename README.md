# Pet Shelter
This is a mono-repo for teaching purposes!

Root level is a Vite+React+JS project.

As a backend we use the CMS strapi (contained in the strapi folder)

### Install dependencies
To install all dependencies

```
npm install
cd strapi
npm install
```

Why don't we use npm workspaces? Currently strapi has an issue with installing its dependencies correctly when using npm workspaces.

### Start the dev environment
In the root folder run

```
npm start
```

### Admin credentials for strapi during development

```
Admin Adminson
Email: admin@adminson.com
Password: Admin123
```

### A note on `strapi/.env`

The `strapi/.env` file (containing `JWT_SECRET`, `APP_KEYS`, etc.) is committed to this repo so you can clone and run immediately. This is fine here because it's a local teaching demo with no real users or data.

**Do not do this in a real project.** In production, `.env` files belong in `.gitignore`, secrets should be generated per-environment, and anything leaked to git history must be rotated.