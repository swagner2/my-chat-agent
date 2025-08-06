# 🤖 Chat Agent Starter Kit

![agents-header](https://github.com/user-attachments/assets/f6d99eeb-1803-4495-9c5e-3cf07a37b402)

<a href="https://deploy.workers.cloudflare.com/?url=https://github.com/cloudflare/agents-starter"><img src="https://deploy.workers.cloudflare.com/button" alt="Deploy to Cloudflare"/></a>

A starter template for building AI-powered chat agents using Cloudflare's Agent platform, powered by [`agents`](https://www.npmjs.com/package/agents). This project provides a foundation for creating interactive chat experiences with AI, complete with a modern UI and tool integration capabilities.

## Features

- 💬 Interactive chat interface with AI
- 🛠️ Built-in tool system with human-in-the-loop confirmation
- 📅 Advanced task scheduling (one-time, delayed, and recurring via cron)
- 🌓 Dark/Light theme support
- ⚡️ Real-time streaming responses
- 🔄 State management and chat history
- 🎨 Modern, responsive UI
- 📧 **Klaviyo API integration** for email marketing and customer management

## Prerequisites

- Cloudflare account
- OpenAI API key
- Klaviyo API key (optional, for email marketing features)

## Quick Start

1. Create a new project:

```bash
npx create-cloudflare@latest --template cloudflare/agents-starter
```

2. Install dependencies:

```bash
npm install
```

3. Set up your environment:

Create a `.dev.vars` file:

```env
OPENAI_API_KEY=your_openai_api_key
KLAVIYO_API_KEY=your_klaviyo_api_key
```

4. Run locally:

```bash
npm start
```

5. Deploy:

```bash
npm run deploy
```

## Klaviyo Integration

This project includes comprehensive Klaviyo API integration for managing email marketing campaigns, customer profiles, and lists. The integration provides both automatic and confirmation-required tools for safe operation.

### Setup

1. **Get your Klaviyo API key**:
   - Log in to your Klaviyo account
   - Go to Account → API Keys
   - Create a new API key or copy an existing one

2. **Configure the API key**:
   - For local development: Add `KLAVIYO_API_KEY=your_key` to your `.dev.vars` file
   - For production: Set the secret using `wrangler secret put KLAVIYO_API_KEY`

### Available Klaviyo Tools

#### Customer Profile Management

- **`createKlaviyoProfile`** - Create a new customer profile (requires confirmation)
  - Parameters: email, firstName, lastName, phoneNumber, address, etc.
  
- **`getKlaviyoProfile`** - Retrieve a customer profile by email (automatic)
  - Parameters: email
  
- **`updateKlaviyoProfile`** - Update an existing customer profile (requires confirmation)
  - Parameters: email, firstName, lastName, phoneNumber, address, etc.

#### List Management

- **`getKlaviyoLists`** - Get all lists from your Klaviyo account (automatic)
  - Parameters: none
  
- **`createKlaviyoList`** - Create a new list (requires confirmation)
  - Parameters: name, description (optional)
  
- **`addProfileToList`** - Add a customer to a list (requires confirmation)
  - Parameters: email, listId
  
- **`removeProfileFromList`** - Remove a customer from a list (requires confirmation)
  - Parameters: email, listId

#### Campaign Management

- **`getKlaviyoCampaigns`** - Get all campaigns from your account (automatic)
  - Parameters: limit (optional, default: 50)
  
- **`sendKlaviyoCampaign`** - Send a campaign (requires confirmation)
  - Parameters: campaignId

#### Analytics

- **`getKlaviyoMetrics`** - Get metrics and analytics data (automatic)
  - Parameters: metricId (optional), since (optional), until (optional)

### Example Usage

Here are some example conversations you can have with the AI agent:

```
User: "Create a new customer profile for john.doe@example.com with first name John and last name Doe"
AI: [Will show confirmation dialog] → Creates profile after confirmation

User: "Get the profile for john.doe@example.com"
AI: [Automatically retrieves and displays profile information]

User: "Show me all my Klaviyo lists"
AI: [Automatically retrieves and displays all lists]

User: "Add john.doe@example.com to the 'Newsletter Subscribers' list"
AI: [Will show confirmation dialog] → Adds to list after confirmation

User: "What campaigns do I have?"
AI: [Automatically retrieves and displays campaign information]
```

### Security Features

- **Human-in-the-loop confirmation** for all data modification operations
- **Automatic execution** for read-only operations
- **Secure API key storage** using Cloudflare Secrets
- **Error handling** with detailed error messages

### API Endpoints Used

The integration uses the following Klaviyo API endpoints with version `2025-07-15`:

- `GET /api/v2/people/search` - Search for profiles
- `POST /api/profiles/` - Create profiles
- `PATCH /api/profiles/{id}/` - Update profiles
- `GET /api/v2/lists` - Get lists
- `POST /api/lists/` - Create lists
- `POST /api/lists/{id}/subscriptions/` - Add to lists
- `DELETE /api/lists/{id}/subscriptions/{profile_id}/` - Remove from lists
- `GET /api/v2/campaigns` - Get campaigns
- `POST /api/v2/campaign/{id}/send` - Send campaigns
- `GET /api/v2/metrics` - Get metrics

## Project Structure

```
├── src/
│   ├── app.tsx        # Chat UI implementation
│   ├── server.ts      # Chat agent logic
│   ├── tools.ts       # Tool definitions (includes Klaviyo tools)
│   ├── utils.ts       # Helper functions
│   └── styles.css     # UI styling
```

## Customization Guide

### Adding New Tools

Add new tools in `tools.ts` using the tool builder:

```ts
// Example of a tool that requires confirmation
const searchDatabase = tool({
  description: "Search the database for user records",
  parameters: z.object({
    query: z.string(),
    limit: z.number().optional(),
  }),
  // No execute function = requires confirmation
});

// Example of an auto-executing tool
const getCurrentTime = tool({
  description: "Get current server time",
  parameters: z.object({}),
  execute: async () => new Date().toISOString(),
});

// Scheduling tool implementation
const scheduleTask = tool({
  description:
    "schedule a task to be executed at a later time. 'when' can be a date, a delay in seconds, or a cron pattern.",
  parameters: z.object({
    type: z.enum(["scheduled", "delayed", "cron"]),
    when: z.union([z.number(), z.string()]),
    payload: z.string(),
  }),
  execute: async ({ type, when, payload }) => {
    // ... see the implementation in tools.ts
  },
});
```

To handle tool confirmations, add execution functions to the `executions` object:

```typescript
export const executions = {
  searchDatabase: async ({
    query,
    limit,
  }: {
    query: string;
    limit?: number;
  }) => {
    // Implementation for when the tool is confirmed
    const results = await db.search(query, limit);
    return results;
  },
  // Add more execution handlers for other tools that require confirmation
};
```

Tools can be configured in two ways:

1. With an `execute` function for automatic execution
2. Without an `execute` function, requiring confirmation and using the `executions` object to handle the confirmed action. NOTE: The keys in `executions` should match `toolsRequiringConfirmation` in `app.tsx`.

### Use a different AI model provider

The starting [`server.ts`](https://github.com/cloudflare/agents-starter/blob/main/src/server.ts) implementation uses the [`ai-sdk`](https://sdk.vercel.ai/docs/introduction) and the [OpenAI provider](https://sdk.vercel.ai/providers/ai-sdk-providers/openai), but you can use any AI model provider by:

1. Installing an alternative AI provider for the `ai-sdk`, such as the [`workers-ai-provider`](https://sdk.vercel.ai/providers/community-providers/cloudflare-workers-ai) or [`anthropic`](https://sdk.vercel.ai/providers/ai-sdk-providers/anthropic) provider:
2. Replacing the AI SDK with the [OpenAI SDK](https://github.com/openai/openai-node)
3. Using the Cloudflare [Workers AI + AI Gateway](https://developers.cloudflare.com/ai-gateway/providers/workersai/#workers-binding) binding API directly

For example, to use the [`workers-ai-provider`](https://sdk.vercel.ai/providers/community-providers/cloudflare-workers-ai), install the package:

```sh
npm install workers-ai-provider
```

Add an `ai` binding to `wrangler.jsonc`:

```jsonc
// rest of file
  "ai": {
    "binding": "AI"
  }
// rest of file
```

Replace the `@ai-sdk/openai` import and usage with the `workers-ai-provider`:

```diff
// server.ts
// Change the imports
- import { openai } from "@ai-sdk/openai";
+ import { createWorkersAI } from 'workers-ai-provider';

// Create a Workers AI instance
+ const workersai = createWorkersAI({ binding: env.AI });

// Use it when calling the streamText method (or other methods)
// from the ai-sdk
- const model = openai("gpt-4o-2024-11-20");
+ const model = workersai("@cf/deepseek-ai/deepseek-r1-distill-qwen-32b")
```

Commit your changes and then run the `agents-starter` as per the rest of this README.

### Modifying the UI

The chat interface is built with React and can be customized in `app.tsx`:

- Modify the theme colors in `styles.css`
- Add new UI components in the chat container
- Customize message rendering and tool confirmation dialogs
- Add new controls to the header

### Example Use Cases

1. **Customer Support Agent**
   - Add tools for:
     - Ticket creation/lookup
     - Order status checking
     - Product recommendations
     - FAQ database search

2. **Development Assistant**
   - Integrate tools for:
     - Code linting
     - Git operations
     - Documentation search
     - Dependency checking

3. **Data Analysis Assistant**
   - Build tools for:
     - Database querying
     - Data visualization
     - Statistical analysis
     - Report generation

4. **Personal Productivity Assistant**
   - Implement tools for:
     - Task scheduling with flexible timing options
     - One-time, delayed, and recurring task management
     - Task tracking with reminders
     - Email drafting
     - Note taking

5. **Scheduling Assistant**
   - Build tools for:
     - One-time event scheduling using specific dates
     - Delayed task execution (e.g., "remind me in 30 minutes")
     - Recurring tasks using cron patterns
     - Task payload management
     - Flexible scheduling patterns

Each use case can be implemented by:

1. Adding relevant tools in `tools.ts`
2. Customizing the UI for specific interactions
3. Extending the agent's capabilities in `server.ts`
4. Adding any necessary external API integrations

## Learn More

- [`agents`](https://github.com/cloudflare/agents/blob/main/packages/agents/README.md)
- [Cloudflare Agents Documentation](https://developers.cloudflare.com/agents/)
- [Cloudflare Workers Documentation](https://developers.cloudflare.com/workers/)

## License

MIT
