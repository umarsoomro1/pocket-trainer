# PocketTrainer Incident Response & Secret Rotation Runbook

## Core Policy
Any secret committed to Git or pushed to a remote repository must be treated as permanently compromised. Git history rewriting does not invalidate live credentials; immediate provider-side revocation and rotation is mandatory.

## Emergency Rotation Procedures

1. **MongoDB Atlas Database Password**
   - Navigate to: **MongoDB Atlas Console -> Database Access**
   - Select the backend service user, generate a secure 32+ character password, and apply.
   - Update `MONGO_URI` in Vercel Project Environment Variables.

2. **JWT Signing Secret & Global Session Revocation**
   - Generate a fresh 64-character hex secret:
     `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`
   - Update `JWT_SECRET` in Vercel Environment Variables.
   - *Emergency User Session Revocation*: Increment `tokenVersion` on target `User` records in MongoDB to immediately invalidate active JWTs across devices.

3. **Gmail SMTP App Password**
   - Navigate to: **Google Account -> Security -> 2-Step Verification -> App Passwords**
   - Revoke the existing `PocketTrainer` app password and generate a replacement.
   - Update `EMAIL_PASS` in Vercel Environment Variables.

4. **Modal AI Inference Secret Key**
   - Re-generate a 64-character random key.
   - Update `AI_AUTH_SECRET` in Modal secrets (`modal secret set ...`) and redeploy the endpoint.
   - Update `AI_API_KEY` in Vercel Environment Variables.

5. **RapidAPI Key**
   - Access RapidAPI Developer Dashboard -> Apps -> Security.
   - Delete the compromised key, create a new application key, and update `RAPIDAPI_KEY` in Vercel.

## Post-Rotation Incident Verification
1. Trigger a zero-cache redeployment in Vercel.
2. Review MongoDB Atlas Network Access and database query audit logs for unexpected IP access during the exposure window.
3. Verify Modal and RapidAPI billing analytics for usage spikes.