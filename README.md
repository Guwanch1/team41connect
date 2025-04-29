# team41connect

An automated application for adding clients to [x-ui](https://github.com/alireza0/x-ui).  
This app simplifies the process of adding clients in x-ui by automating key steps.

---

## Step-by-step Setup

1. Install dependencies

    npm i

---

2. Create a `.env` file

    Create a `.env` file in the root directory with the following environment variables:

    ```
    USERNAME=''   # Your login username for x-ui
    PASSWORD=''   # Your login password for x-ui
    HOST=''       # x-ui server host (e.g., localhost or IP address)
    PORT=''       # x-ui server port (e.g., 3000)
    SECRET=''     # Secret URL path for authentication (optional based on your setup)
    ```

    🔐 **Note**: `SECRET` defines the private route used to access the app securely.

---

3. Start the app

    ```
    node index.js
    ```

    The app will run and automate adding clients to your x-ui server. Visit:

    ```
    http://HOST:PORT/SECRET
    ```

    Example: `http://localhost:3000/mysecretpath`

---
