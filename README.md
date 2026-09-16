# DSA Roadmap — Student Site

A static HTML/CSS/JS site: students sign up, log in, and check off DSA
problems as they solve them. Progress is saved per-student in the cloud
(Firebase), so it follows them across devices — not just one browser.

## File overview

```
index.html      → sends visitors to login.html or app.html
login.html      → log in
signup.html     → create an account
app.html        → the roadmap tracker (locked behind login)
css/style.css   → all styling
js/firebase-config.js → YOUR project keys go here (step 1 below)
js/auth.js      → signup / login / logout / route protection
js/data.js      → the roadmap content (topics, groups, problems)
js/app.js       → renders the roadmap + syncs progress to Firestore
```

## Step 1 — Create a free Firebase project (~5 minutes)

1. Go to https://console.firebase.google.com and click **Add project**.
   Name it anything (e.g. "dsa-roadmap"). You can skip Google Analytics.
2. Once created, click the **web icon (`</>`)** on the project overview
   page to register a web app. Give it any nickname.
3. Firebase will show you a `firebaseConfig` object with six values
   (`apiKey`, `authDomain`, `projectId`, etc). Copy them into
   `js/firebase-config.js`, replacing the placeholder text.

## Step 2 — Turn on Email/Password login

1. In the Firebase console sidebar: **Build → Authentication → Get started**.
2. Under the **Sign-in method** tab, enable **Email/Password**.

## Step 3 — Create the Firestore database

1. In the sidebar: **Build → Firestore Database → Create database**.
2. Choose **Start in production mode**, pick a region close to your
   students, and click Create.
3. Go to the **Rules** tab and replace the rules with this, then **Publish**.
   This makes sure a student can only ever read or write their *own*
   progress document — nobody can see or edit another student's data:

   ```
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       match /students/{studentId} {
         allow read, write: if request.auth != null && request.auth.uid == studentId;
       }
     }
   }
   ```

That's it for backend setup — no server to run or maintain.

## Step 4 — Try it locally

Because the pages use `fetch`-like module loading under the hood, open
this folder with a simple local server rather than double-clicking the
HTML files (double-clicking works in most browsers too, but a local
server avoids occasional browser security quirks):

```bash
cd dsa-site
python3 -m http.server 5500
```

Then visit `http://localhost:5500` and try creating an account.

## Step 5 — Deploy for free

Any static host works since there's no backend code. Pick one:

- **Netlify**: drag-and-drop the whole `dsa-site` folder onto
  https://app.netlify.com/drop
- **Vercel**: `npx vercel` from inside the folder
- **GitHub Pages**: push the folder to a GitHub repo, then enable Pages
  in the repo's Settings → Pages, pointing at the root of the branch

No environment variables needed — the Firebase config in
`js/firebase-config.js` is meant to be public; security is enforced by
the Firestore rules above, not by hiding the keys.

## Customizing the roadmap content

Everything students see — topics, groups, problems, difficulty labels —
lives in `js/data.js` as a plain JavaScript array. Add, remove, or
reorder entries there; the page picks it up automatically, no other
code changes needed.

## Notes on students and grading

- Each student's row lives in Firestore under `students/{their-uid}`,
  with fields `name`, `email`, and `completed` (a map of problem title
  → `true`).
- To see class-wide progress later, you could build a small admin page
  that reads all documents in the `students` collection — ask if you'd
  like that added.
