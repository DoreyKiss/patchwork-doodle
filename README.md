# patchwork-doodle

party.. disco disco, party paarty.....quarantine

## Dev environment

### Required tools

- Visual Studio Code
- npm
  - firebase-tools
  - @angular/cli
- Windows Terminal

### Setup dev environment

- Clone repo with `git clone https://github.com/DoreyKiss/patchwork-doodle`
- `cd patchwork-doodle`
- `npm install`

### Running locally

- `cd webapp`
- If you have Windows Terminal installed, `npm run devall` to start all services.
- If not, start in separate terminals:
  - firebase emulators: `npm run dev`
  - frontend watch + build: `npm run dev2`
  - backend watch + build: `npm run dev3`
- Access local website at `http://localhost:5000/` and emulator hub at `http://localhost:4000/`.
- Always manually stop firebase emulators (CTRL+C) to release used ports.

## Deployment

- Ensure that no emulator or watch+build is running.
- `cd webapp`
- `firebase deploy`
  - Use `firebase deploy --only database` to deploy just the database rules.
  - Use `firebase deploy --only functions` to deploy just the back-end functions.
  - Use `firebase deploy --only hosting` to deploy just the front-end.
