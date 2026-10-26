# Pages retry fix - 26 October 2026

Failed run: https://github.com/yhaggalla/EQ_MAINTENANCE/actions/runs/40298900238, attempt 2, job 121500532531, commit c272fe2a65e29d90fbdbdfe7c5dd075591a33fae. Packaging and upload succeeded; deployment failed because two artifacts named github-pages existed. Verified artifact IDs: 12640110107 (09:21 UTC) and 12640213783 (09:42 UTC). The punycode/Node warning did not cause this selection failure.

Current remote/local main is e62ce787e71564b3764af0ec1aee6e6e4fbfbee9 and contains no .github/workflows/deploy-demo.yml. The proposed full workflow restores that file from the failed commit, with only two additions: upload name and deployment artifact_name both use github-pages-${{ github.run_id }}-${{ github.run_attempt }}. A retry selects its own artifact even when earlier attempts remain. Trigger stays workflow_dispatch, main branch only; no push trigger or permission expansion.

Review `deploy-demo.yml`; `restore-workflow.patch` adds it to .github/workflows/deploy-demo.yml. `git apply --check` passes without modifying the app. `checks.json`: 13 local checks pass, packaging 51 files with current C62 cleanup, temporary walkthrough, licensed Three.js viewer and model files. No complete YAML schema validation or GitHub/deployment execution claimed. The initial package-presence assertion used the wrong vendor path; corrected it to the existing qc/vendor/three/three.module.js path and reran successfully.

GitHub CLI was unavailable. Current connector tools supplied authenticated workflow source, artifact listing, job status and logs; a public API read located the run. Official action definitions confirm upload input `name` and deploy input `artifact_name`:
- https://github.com/actions/upload-pages-artifact/blob/v4/action.yml
- https://github.com/actions/deploy-pages/blob/v4/action.yml

The user approved "commit and push it" after reviewing the proposal. Applied `restore-workflow.patch` to restore `.github/workflows/deploy-demo.yml`; its content matches the reviewed proposal. The accompanying local commit includes the workflow and these preparation/verification records for pushing to main. `checks.json` records the earlier proposal-stage validation, when patchApplied was false. No application runtime changes, artifact deletion, workflow rerun or deployment is included. Hard production/publishing boundaries remain in force. Obtain explicit authorization before any publication/new deployment run. Do not re-run the old failed job: old runs retain their original workflow definition.
