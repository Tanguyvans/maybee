---
description: testing from gitbook
---

# MayBee 🐝

MayBee is a decentralized prediction market platform built on the Flow blockchain.

## Links

[MayBee Telegram](https://t.me/maybee01_bot) [Smart Contract Github](https://github.com/HemangVora/MayBee-contract)

## Getting Started

These instructions will get you a copy of the project up and running on your local machine for development and testing purposes.

### Prerequisites

* Node.js (v14 or later)
* npm or yarn
* Flow CLI
* Telegram Bot Token

### Installation

1.  Clone the repository:

    ```
    git clone https://github.com/yourusername/maybee.git
    cd maybee
    ```
2.  Install dependencies:

    ```
    npm install
    ```

    or if you're using yarn:

    ```
    yarn install
    ```
3.  Create a `.env` file in the root directory and add your environment variables:

    ```
    NEXT_PUBLIC_DYNAMIC_ENV_ID=your_dynamic_env_id
    TELEGRAM_BOT_TOKEN=your_telegram_bot_token
    LOGIN_URL=your_login_url
    ```

### Running the Application

To run the application in development mode:

```
npm run dev
```

or

```
yarn dev
```

The application will be available at `http://localhost:3000`.

## Deploying to Vercel

1. Push your code to a GitHub repository.
2. Go to [Vercel](https://vercel.com) and sign in or create an account.
3. Click "Import Project" and select your GitHub repository.
4. Configure your project settings:
   * Framework Preset: Next.js
   * Build Command: `npm run build` or `yarn build`
   * Output Directory: `.next`
5. Add your environment variables in the Vercel project settings.
6. Click "Deploy" and wait for the deployment to complete.

## Running the Telegram Bot

To run the Telegram bot:

1. Ensure you have set the `TELEGRAM_BOT_TOKEN` in your `.env` file.
2.  Run the bot script:

    ```
    ts-node telegram/bot.ts
    ```

The bot should now be active and responding to commands in your Telegram channel.

## Built With

* [Next.js](https://nextjs.org/) - The React framework used
* [Flow Blockchain](https://www.onflow.org/) - The blockchain platform
* [Dynamic](https://www.dynamic.xyz/) - For wallet connection and authentication
* [Telegraf](https://telegraf.js.org/) - Telegram bot framework
