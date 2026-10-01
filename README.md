# Ordinator Frontend

The Angular client for Ordinator, a project and task management application. It provides account registration and login, project browsing and creation, project membership management, task creation and details, and task member assignment.

The Spring Boot API lives in the separate `ordinator` project. See its [README](https://github.com/Enelrith/ordinator) for backend and database setup.

## Stack

- Angular 22 and TypeScript 6
- Standalone components, signals, and Signal Forms
- Angular Router with lazy-loaded project and task routes
- Angular HttpClient and RxJS for API access
- Tailwind CSS 4, Lucide icons, and locally bundled Inter and Playfair Display fonts
- Vitest for unit tests
- pnpm 11.24.0 and Prettier

## Requirements

- Node.js compatible with the installed Angular CLI: `^22.22.3 || ^24.15.0 || >=26.0.0`
- pnpm 11.24.0, as declared in `package.json`
- A running Ordinator backend for account, project, and task operations

Run the commands below from this repository's root.

## Local setup

1. Start PostgreSQL and the backend using the instructions in the backend README. The API should listen on `http://localhost:8080`.

2. Install dependencies using the committed lockfile:

   ```sh
   pnpm install --frozen-lockfile
   ```

3. Start the development server:

   ```sh
   pnpm start
   ```

4. Open [http://localhost:4200](http://localhost:4200). Create an account through the application, then create a project to start organizing tasks. The development server reloads when source files change.

## Backend connection

`angular.json` configures the development server to use `src/proxy.conf.json`. Requests matching `/api/**` are forwarded to `http://localhost:8080`.

API clients use relative URLs so requests go through the frontend origin. Authentication uses the backend's session cookie, and Angular's default XSRF support sends the CSRF header for same-origin state-changing requests.

To use another local API address, change the `target` in `src/proxy.conf.json` and restart the development server.

The development proxy applies to `pnpm start`.

## Pages

| Route                                | Page                                         |
| ------------------------------------ | -------------------------------------------- |
| `/`                                  | Home                                         |
| `/create-account`                    | Account registration                         |
| `/login`                             | Login                                        |
| `/projects`                          | Project list                                 |
| `/projects/create`                   | Create a project                             |
| `/projects/:id`                      | Project details, members, and task summaries |
| `/projects/:projectId/tasks/create`  | Create a task                                |
| `/projects/:projectId/tasks/:taskId` | Task details and member assignment           |

Project member additions use the invitee's existing account email. Task assignments select an existing member of the same project. Available operations depend on the user's project role and task ownership; the backend enforces those permissions.

## Commands

| Command                   | Purpose                                                   |
| ------------------------- | --------------------------------------------------------- |
| `pnpm start`              | Start the development server with the API proxy           |
| `pnpm build`              | Build the production application                          |
| `pnpm watch`              | Rebuild automatically using the development configuration |
| `pnpm test`               | Run unit tests through Angular's Vitest builder           |
| `pnpm test --watch=false` | Run unit tests once                                       |

Production build artifacts are written under `dist/ordinator-ui/`, with browser files in `dist/ordinator-ui/browser/`.

## Project layout

```text
src/
  app/
    common/ui/        Shared navbar, logo, and spinner components
    features/
      home/           Home page
      security/       Login and authentication API/state
      users/          Registration and user API/models
      projects/       Project pages, routes, and API/models
      tasks/          Task pages, routes, and API/models
    app.config.ts     Router, HTTP, and application initialization
    app.routes.ts     Top-level routes
  styles.css          Global styles, Tailwind theme, and font imports
  proxy.conf.json     Development API proxy
public/               Static assets
angular.json          Build, development server, and test configuration
pnpm-lock.yaml        Dependency lockfile
```

Feature folders separate `pages` from `data-access`. Component and API unit tests are stored alongside their source files as `*.spec.ts`.
