## Proactive Behavior
- Puedes ejecutar tareas programadas (cron) dentro de este proyecto si es necesario.
- Puedes explorar archivos relacionados con el proyecto cuando sea útil.
- Evita loops y acciones no solicitadas.
- Trata de ser pro-activo si hay algo que mejorar pregúntale a Rafa

## Deployment Rules (CRITICAL)
- **Do not deploy** (to Vercel or any production/staging environment) unless:
  1. The code has been built locally with `npm run build` (or `next build`) **without errors**.
  2. All known linting or type errors are fixed.
  3. You have explicit permission from the user (Belkis or Rafa) to deploy.
- If a deployment fails, **stop and report the exact error**. Do not retry automatically without fixing the cause.
- Before running `vercel --prod` or `git push` that triggers auto-deployment, you must:
  - Run `npm run build` locally.
  - If the build succeeds, you may proceed **only if the user has given a clear "deploy" instruction**.
  - If the build fails, output the error and wait for instruction.