# Localhost se free public demo tak

Guide checked: 28 October 2026. Provider plans aur dashboards badal sakte hain; setup ke waqt linked official pages bhi dekhein.

## Recommended route

Har app mein Express React ka built frontend aur `/api` dono serve karta hai. Is liye ek app ko ek **Node web service** aur ek MongoDB database chahiye. Sirf static HTML hosting par full app ka backend nahin chalega.

- Local development: aapka computer, `npm run dev`, no hosting account.
- Public portfolio demo: Render **Free Web Service** + MongoDB Atlas **Free cluster**.
- Optional paid external services: AI provider ya real outbound email. Inke baghair included demo modes use karein.

## 1. MongoDB Atlas Free cluster

1. https://www.mongodb.com/atlas par apna account kholein.
2. **Free cluster** choose karein. Paid tier select karna required nahin.
3. App ke liye database user/password banayein. Database password Atlas website ke login se alag hota hai.
4. **Network Access** mein apne hosting provider ke documented outbound IP ranges allow karein. Local testing ke liye apna current IP allow karein.
5. **Connect → Drivers → Node.js** se URI copy karein aur password replace karein. Password mein special characters hon to URI-encode karein.
6. Har project ke liye separate database name rakhein:

```text
mongodb+srv://<db-user>:<encoded-password>@<cluster-host>/shopflow?retryWrites=true&w=majority
mongodb+srv://<db-user>:<encoded-password>@<cluster-host>/bookease?retryWrites=true&w=majority
mongodb+srv://<db-user>:<encoded-password>@<cluster-host>/clientdesk?retryWrites=true&w=majority
mongodb+srv://<db-user>:<encoded-password>@<cluster-host>/supportpilot?retryWrites=true&w=majority
mongodb+srv://<db-user>:<encoded-password>@<cluster-host>/servicehub?retryWrites=true&w=majority
```

Yeh placeholders hain; apni URI use karein. Ek Free cluster par in demo apps ke separate databases rakh sakte hain, cluster ki shared capacity ke andar.

Official setup: https://www.mongodb.com/docs/get-started/

Free cluster limitations: https://www.mongodb.com/docs/atlas/reference/free-shared-limitations/

## 2. Code GitHub par upload karein

Apne GitHub account mein repo banayein. Easiest option: har app ke folder ke contents ko uske apne repo ke root mein rakhein. Ya poora pack ek repo mein rakhein aur Render mein app ka **Root Directory** select karein.

Sirf code commit karein. Included `.gitignore` follow karein; `.env`, database credentials, provider keys, `node_modules` aur `.data` upload na karein.

## 3. Render Free Web Service

1. https://render.com par account banayein aur **New → Web Service** select karein.
2. Apna GitHub repo connect karein.
3. Runtime **Node**, Instance Type **Free** select karein.
4. Agar repo mein poora pack hai to Root Directory set karein:

| App          | Root Directory    |
| ------------ | ----------------- |
| ShopFlow     | `01-shopflow`     |
| BookEase     | `02-bookease`     |
| ClientDesk   | `03-clientdesk`   |
| SupportPilot | `04-supportpilot` |
| ServiceHub   | `05-servicehub`   |

Repo ke andar agar ek aur outer `MERN-Portfolio-Pack` folder hai to root directory mein uska prefix bhi chahiye. Agar project ke files repo ke root mein hain to Root Directory blank rakhein.

5. Build Command:

```sh
npm ci --include=dev && npm run build
```

6. Start Command:

```sh
npm start
```

`--include=dev` important hai: Vite build dependency production environment mein bhi install honi chahiye.

7. Environment settings:

| Variable       | Value                                                                                                        |
| -------------- | ------------------------------------------------------------------------------------------------------------ |
| `NODE_VERSION` | `24`                                                                                                         |
| `NODE_ENV`     | `production`                                                                                                 |
| `MONGODB_URI`  | Is app ki real Atlas URI                                                                                     |
| `JWT_SECRET`   | Har app ke liye separate long random secret                                                                  |
| `SEED_DEMO`    | `true` agar sample accounts/data ke saath public portfolio demo chahiye; app README ke defaults check karein |

App ki `.env.example` ke extra settings bhi dekhein. Render apna `PORT` set karta hai; hosted service mein localhost wala port force na karein. Agar app public base URL maange to initial deploy ke baad Render URL set karke redeploy karein.

JWT secret generate karne ka local command:

```sh
node -e "console.log(require('node:crypto').randomBytes(48).toString('hex'))"
```

Yeh generated secret Render ke environment panel mein paste karein; GitHub/source mein nahin.

8. Deploy karein aur build logs mein success wait karein. Render jo actual `https://...onrender.com` URL de, wahi public live link hoga.
9. Login, create/edit flow aur refresh ke baad persistence check karein. Restart ke baad bhi MongoDB records rehne chahiye.

Official Express deploy guide: https://render.com/docs/deploy-node-express-app

## Free plan ki practical limits

Render Free idle service ko 15 minutes baad sleep karta hai. Next visit par start hone mein waqt lag sakta hai. Free instance hours workspace mein shared hain: current allowance 750 hours/month hai. Paanch services 24/7 chalaana is allowance mein fit nahin hota; portfolio traffic ke liye usage monitor karein. Bandwidth/build limits bhi apply hoti hain.

Render ka local disk ephemeral hai. Hosted app ko file demo mode mein chhodne se restart/sleep/redeploy par data lose ho sakta hai. Is liye public demo ke liye real `MONGODB_URI` set karein.

Free service par SMTP ports 25/465/587 blocked hain. BookEase ka demo outbox kaam karega; actual Render email ke liye HTTP email provider integration chahiye. SMTP configuration local machine/compatible host ke liye hai.

Atlas Free ki capacity limited hai aur idle clusters pause ho sakte hain. Yeh route portfolio demos ke liye hai. OpenAI/API credits aur real payment transactions free hosting ke saath automatically include nahin hote.

Official up-to-date free plan details: https://render.com/docs/free

## Vercel/Netlify ka option

React frontend alag host karna possible hai, lekin is pack ka Express server phir bhi alag backend host maangta hai. Current single-service build ke liye Render route straightforward hai. Sirf `client/dist` upload karke complete MERN app live nahin hoti.

## Live link share karne se pehle

App ka actual demo flow run karein aur README ke advertised features verify karein. Real personal records ya card details sample demo mein na dalein. Demo logins ko demo accounts hi rakhein. Integration mode labels rehne dein, taa-ke visitor ko checkout/local search/email behavior clear ho.
