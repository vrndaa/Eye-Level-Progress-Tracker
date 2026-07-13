# Classroom API feasibility spike (read-only)

Answers one question: **can we read Google Classroom data (topics, assignments, statuses)
through the API?** It runs against a throwaway test class on your **personal Gmail** — no real
Enopi or student data is ever touched.

**This script only reads.** It never creates, edits, or deletes anything — the permissions it
asks for are all "See / view" scopes. (That also matches the real product, which is read-only.)
Because it doesn't create the class for you, you make a quick throwaway one by hand first — which
is also the *better* test, since that's exactly how the graders make their classes.

---

## Step A — make a throwaway test class (by hand, ~5 min)

On [classroom.google.com](https://classroom.google.com), signed in with your **personal Gmail**:
1. Click **+** → **Create class** → name it `API Spike - Test Gr5` → Create.
2. Go to the **Classwork** tab → **Create → Topic** → add a couple: `English Classwork`, `English Homework`.
3. **Create → Assignment** a few times, putting each under a topic. Make one a FIC by putting
   `fic` + a date in the title, e.g.:
   - `Reading Selection Gr5 Week 2`  (topic: English Classwork)
   - `DGP Gr5 week 1. fic Jul1`  (topic: English Classwork)  ← the FIC one
   - `Root Words Gr5 part 3`  (topic: English Homework)
4. That's enough. (You don't need real students — we're only testing that the API can *read* this.)

## Step B — set up API access (one time, ~10 min)

**1. Enable the Classroom API**
- [console.cloud.google.com](https://console.cloud.google.com), signed in with the **same personal Gmail**.
- Reuse your project. Search **"Google Classroom API"** → **Enable**.

**2. Make a Desktop OAuth client**
- APIs & Services → **Credentials** → **Create credentials → OAuth client ID**.
- Application type: **Desktop app** → Create.  ← see note below on why Desktop, not Web
- Click **Download JSON**. Save it in this folder as **`credentials.json`**.

> **Why "Desktop app" and not "Web application"?**
> The OAuth client type matches the *program doing the connecting*, not the final product.
> This spike is a **Node script run on your laptop** (`node classroom-spike.mjs`), so it uses the
> **Desktop app** flow (opens a browser, you click Allow, it gets a token locally).
>
> The **PWA is a web app** and will need a **separate "Web application" OAuth client** later
> (with `localhost` / hosted origins) when we wire its real Classroom connection — like the one
> we started for the Sheets attempt. Two different programs → two different OAuth clients:
>
> | Program | What it is | OAuth client type |
> |---|---|---|
> | This spike script | Node script on your laptop | **Desktop app** |
> | The PWA (later) | Browser web app | Web application |
>
> So: Desktop app is correct *for the spike only*. It does not mean the PWA is a desktop app.

**3. Add yourself as a test user**
- APIs & Services → OAuth consent screen (Google Auth Platform) → **Audience** → **Test users**
  → add your personal Gmail. (Keeps it in "Testing" — no Google review needed.)

## Step C — run it

```bash
cd "enopi-fic-pwa/spike"
npm install googleapis @google-cloud/local-auth
node classroom-spike.mjs
```
- A browser opens → sign in with your personal Gmail → you'll see "Google hasn't verified this
  app" (normal for your own test app) → **Continue** → **Allow** (all requested items are "See/view").
- The script finds your test class and reads it back.

**✅ Success looks like:** a list of topics (English Classwork, Homework) and assignments, with the
`DGP … fic Jul1` one flagged `<-- FIC detected`. That means the API can read grader-made data — the
whole plan is feasible.

---

## Notes
- The permissions are **read-only** — this script cannot change anything in your Classroom.
- `credentials.json` is a secret — it's gitignored, don't commit it.
- The test class is a throwaway. Delete it from Classroom anytime.
- I (Claude) can't run this for you — it needs your Google sign-in and consent. Run it, then paste
  me the output and I'll tell you what it means and what to build next.
