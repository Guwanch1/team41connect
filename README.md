# team41connect

A minimal blog app built with Node.js, Express, and EJS.
Includes basic authentication and in-memory post management.

---

## Step-by-step Setup

1. Install dependencies

npm i

---

2. Create a .env file

Create a .env file in the root directory with the following environment variables:

USERNAME=''   # Your login username
PASSWORD=''   # Your login password
HOST=''       # Your server host (e.g., localhost)
PORT=''       # Server port (e.g., 3000)
SECRET=''     # Secret URL path for authentication

SECRET defines the private route used to access the app securely.

---

3. Start the app

node index.js

Then visit:

http://HOST:PORT/SECRET

Example: http://localhost:3000/mysecretpath

---
