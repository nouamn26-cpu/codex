# MERN Portfolio Pack — pehle yeh parhein

Is pack mein paanch independent web applications hain. Har app ka React frontend, Express/Node backend, MongoDB/Mongoose connection, local file demo storage, sample data aur detailed Codex build prompt shamil hai.

| Folder            | App                                   | Local URL             |
| ----------------- | ------------------------------------- | --------------------- |
| `01-shopflow`     | Desk accessories e-commerce + admin   | http://localhost:4101 |
| `02-bookease`     | Salon appointments + staff dashboard  | http://localhost:4102 |
| `03-clientdesk`   | Agency CRM + separate workspaces      | http://localhost:4103 |
| `04-supportpilot` | Knowledge helpdesk + optional AI      | http://localhost:4104 |
| `05-servicehub`   | Tutor marketplace + requests/messages | http://localhost:4105 |

## 1. Extract aur VS Code mein open karein

RAR ko WinRAR/7-Zip se extract karein. ZIP alternative Windows ke built-in Extract All se khul jata hai. Archive ke andar files edit na karein; pehle extract karein.

`MERN-Portfolio.code-workspace` double-click karein ya VS Code mein **File → Open Folder → MERN-Portfolio-Pack** select karein. Agar VS Code ka `code` terminal command available hai:

```sh
code MERN-Portfolio.code-workspace
```

Har app ki `BUILD_PROMPT.md` Codex agent mein paste karke project ko dobara build ya extend kar sakte hain. Combined prompts `PROMPTS-ALL-PROJECTS.md` mein hain.

## 2. Local app start karein

Node.js 24 aur npm install hone chahiye. VS Code ka naya terminal kholein aur pehle ek app chalayein:

```sh
cd 02-bookease
npm install
npm run dev
```

Terminal mein jo localhost link aaye usse browser mein kholein. BookEase ka default `http://localhost:4102` hai. Stop karne ke liye terminal mein **Ctrl+C** dabayein.

Local demo ke liye MongoDB account zaroori nahin. Demo records aapke computer par save hote hain. Har app ke `README.md` mein demo login, actual feature list aur storage details hain. Login screen bhi demo access dikhati hai.

Optional settings ke liye `.env.example` ki copy `.env` banayein. Windows PowerShell mein:

```powershell
Copy-Item .env.example .env
```

Windows CMD mein `copy .env.example .env`; macOS/Linux mein `cp .env.example .env` use karein. VS Code mein file duplicate karke naam `.env` rakhna bhi theek hai.

**VS Code Live Server extension se MERN backend nahin chalta.** Is pack ke liye npm commands use karein. `localhost` aapke apne computer ka address hai; clients ko share karne ke liye public hosting chahiye.

## 3. Sab projects install karna

Pack ke main folder mein:

```sh
npm run install:all
npm run build:all
npm test
```

`install:all` har app ke tested lockfile se `npm ci` chalata hai. Root folder ke liye alag dependencies install karne ki zaroorat nahin. Commands sequential hain; pehli installation ke liye internet chahiye. Internet se npm packages install hone ke baad local knowledge demo aur simulated checkout third-party keys ke baghair chal sakte hain.

Har app apne terminal mein chal sakti hai. Main folder se shortcuts:

```sh
npm run dev:shop
npm run dev:booking
npm run dev:crm
npm run dev:support
npm run dev:marketplace
```

Ek terminal mein sirf ek long-running dev command chalayein; doosri app ke liye naya terminal kholein. Alag default ports ki wajah se paanchon saath chal sakti hain.

## 4. Build aur production-style local run

Kisi ek project ke folder mein:

```sh
npm run build
npm start
```

Express built React frontend aur API ek hi URL se serve karta hai. MongoDB use karne ke liye app ki `.env.example` follow karein aur `MONGODB_URI` set karein. Production environment mein strong unique `JWT_SECRET` required hai. Backend keys kabhi `VITE_` variables mein na rakhein.

## 5. Free public hosting

Step-by-step `FREE-HOSTING.md` follow karein. Recommended demo route: Render Free web service + MongoDB Atlas Free cluster. Har folder mein `render.yaml` reference bhi hai. Aapke hosting/database accounts aur environment values aap set karenge; is pack ko deliver karte waqt koi public deployment create nahin ki gayi.

## 6. Portfolio par present karna

Pehle branding, text aur sample content apne mutabiq customize karein. Live link, 3–5 screenshots, 60–90 second walkthrough aur project ka GitHub link add karein. Inhein **Personal Demo Projects** label karein. Demo payment ko actual payment integration ya local search ko live AI ke taur par present na karein.

`FEATURES-AND-VALIDATION.md` mein verified behavior aur remaining integration limits milenge. Yeh portfolio MVPs hain; public paid customer use se pehle apne requirements ke mutabiq review aur deployment testing karein.

## Common issues

| Issue                         | Fix                                                                                                     |
| ----------------------------- | ------------------------------------------------------------------------------------------------------- |
| `npm` command nahin mil raha  | Node.js install karke VS Code restart karein; `node -v` aur `npm -v` check karein.                      |
| Port already in use           | Purana terminal Ctrl+C se stop karein ya `.env` ka `PORT` badlein.                                      |
| `dist` / built client missing | Project folder mein `npm run build`, phir `npm start`. Development ke liye `npm run dev` use karein.    |
| Database connection fail      | URI/password/database name aur Atlas Network Access check karein. Local demo ke liye URI blank rakhein. |
| `.env` nazar nahin aati       | VS Code Explorer mein `.env.example` duplicate karein; Windows mein extensions visible rakhein.         |
| npm PowerShell policy error   | VS Code terminal profile **Command Prompt** select karein ya `npm.cmd` use karein.                      |

Source, prompts aur lockfiles archive mein shamil hain. Download size kam rakhne ke liye `node_modules`, private `.env`, local runtime data aur generated build folders shamil nahin.
