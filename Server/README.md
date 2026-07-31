# MaintainerAI Server - Microservices Architecture

This backend folder is structured with an **API Gateway** and a **services/** directory containing all microservices.

```text
Server/
├── gateway/               (API Gateway - Port 8000)
│   ├── package.json
│   └── index.js
│
└── services/              (Microservices Directory)
    ├── github-service/    (GitHub, Auth & Webhooks - Port 8003)
    │   ├── package.json
    │   └── src/...
    ├── ai-service/        (LangGraph Triage Workflow - Port 8002)
    │   ├── package.json
    │   └── src/...
    └── report-service/    (MongoDB Triage Reports - Port 8004)
        ├── package.json
        └── src/...
```

---

## How to Create a New Microservice in 3 Steps

### Step 1: Copy the template folder
Copy `services/template-service/` and rename it to your new service name (e.g., `services/payment-service/`).

### Step 2: Set port and write routes
Open your new service's `index.js` and set a unique port (e.g. `8003`):
```js
const PORT = 8003;
```
Write your Express routes as usual.

### Step 3: Add route to API Gateway (`gateway/index.js`)
Open `gateway/index.js` and add 1 line to proxy your new service:
```js
app.use('/api/payment', proxy('http://localhost:8003'));
```

That's it! Your new microservice is now connected to the API Gateway.
