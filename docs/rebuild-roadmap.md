name: Check V3.69 Offline reward completion
on:
  push:
    paths:
      - 'src/stoneage_offline_reward_batch.mjs'
      - 'src/stoneage_browser_idle_runtime.mjs'
      - 'src/stoneage_browser_state_controller.mjs'
      - 'src/stoneage_reward_transaction.mjs'
      - 'src/stoneage_offline_resume.mjs'
      - 'src/stoneage_save_transaction.mjs'
      - 'tools/check_v369_offline_reward_completion.mjs'
      - 'docs/reference/v369-offline-reward-completion.md'
      - 'data/generated/stoneage_offline_reward_batch_schema.json'
      - 'docs/rebuild-roadmap.md'
      - '.github/workflows/check-v369-offline-reward-completion.yml'
  workflow_dispatch:
permissions:
  contents: read
jobs:
  regression:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4
        with:
          fetch-depth: 1
      - name: Run V3.69 regression
        run: node tools/check_v369_offline_reward_completion.mjs
      - name: Check JavaScript syntax
        run: |
          node --check src/stoneage_offline_reward_batch.mjs
          node --check src/stoneage_browser_idle_runtime.mjs
          node --check src/stoneage_browser_state_controller.mjs
          node --check tools/check_v369_offline_reward_completion.mjs
