# Project rules

## Run instructions

- **Run and verify run instructions when implementing features.**  
  When you add or change run instructions (e.g. in README, docs, or implementation summaries), run them to verify they work:
  - Start required servers (e.g. `npm run start` in chat-api, `npm run dev`)
  - Confirm processes start successfully
  - Do this when applicable (e.g. new backend, new dev workflow, changes to startup commands)

## Git workflow

- **Commit and push with every major change or feature add.**  
  After implementing a significant change, new feature, or refactor, run:
  - `git add .`
  - `git commit -m "Brief description of the change"`
  - `git push`

This keeps the remote repo in sync and preserves a clear history.
