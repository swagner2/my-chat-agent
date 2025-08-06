/**
 * Tool definitions for the AI chat agent
 * Tools can either require human confirmation or execute automatically
 */
import { tool } from "ai";
import { z } from "zod";

import type { Chat } from "./server";
import { getCurrentAgent } from "agents";
import { unstable_scheduleSchema } from "agents/schedule";

/**
 * Weather information tool that requires human confirmation
 * When invoked, this will present a confirmation dialog to the user
 * The actual implementation is in the executions object below
 */
const getWeatherInformation = tool({
  description: "show the weather in a given city to the user",
  parameters: z.object({ city: z.string() }),
  // Omitting execute function makes this tool require human confirmation
});

/**
 * Local time tool that executes automatically
 * Since it includes an execute function, it will run without user confirmation
 * This is suitable for low-risk operations that don't need oversight
 */
const getLocalTime = tool({
  description: "get the local time for a specified location",
  parameters: z.object({ location: z.string() }),
  execute: async ({ location }: { location: string }) => {
    console.log(`Getting local time for ${location}`);
    return "10am";
  },
});

const scheduleTask = tool({
  description: "A tool to schedule a task to be executed at a later time",
  parameters: unstable_scheduleSchema,
  execute: async ({ when, description }: { when: any; description: string }) => {
    // we can now read the agent context from the ALS store
    const { agent } = getCurrentAgent<Chat>();

    function throwError(msg: string): string {
      throw new Error(msg);
    }
    if (when.type === "no-schedule") {
      return "Not a valid schedule input";
    }
    const input =
      when.type === "scheduled"
        ? when.date // scheduled
        : when.type === "delayed"
          ? when.delayInSeconds // delayed
          : when.type === "cron"
            ? when.cron // cron
            : throwError("not a valid schedule input");
    try {
      agent!.schedule(input!, "executeTask", description);
    } catch (error) {
      console.error("error scheduling task", error);
      return `Error scheduling task: ${error}`;
    }
    return `Task scheduled for type "${when.type}" : ${input}`;
  },
});

/**
 * Tool to list all scheduled tasks
 * This executes automatically without requiring human confirmation
 */
const getScheduledTasks = tool({
  description: "List all tasks that have been scheduled",
  parameters: z.object({}),
  execute: async () => {
    const { agent } = getCurrentAgent<Chat>();

    try {
      const tasks = agent!.getSchedules();
      if (!tasks || tasks.length === 0) {
        return "No scheduled tasks found.";
      }
      return tasks;
    } catch (error) {
      console.error("Error listing scheduled tasks", error);
      return `Error listing scheduled tasks: ${error}`;
    }
  },
});

/**
 * Tool to cancel a scheduled task by its ID
 * This executes automatically without requiring human confirmation
 */
const cancelScheduledTask = tool({
  description: "Cancel a scheduled task using its ID",
  parameters: z.object({
    taskId: z.string().describe("The ID of the task to cancel"),
  }),
  execute: async ({ taskId }: { taskId: string }) => {
    const { agent } = getCurrentAgent<Chat>();
    try {
      await agent!.cancelSchedule(taskId);
      return `Task ${taskId} has been successfully canceled.`;
    } catch (error) {
      console.error("Error canceling scheduled task", error);
      return `Error canceling task ${taskId}: ${error}`;
    }
  },
});

/**
 * Klaviyo API Tools
 */

/**
 * Create a new profile in Klaviyo
 * This requires human confirmation as it creates customer data
 */
const createKlaviyoProfile = tool({
  description: "Create a new customer profile in Klaviyo",
  parameters: z.object({
    email: z.string().email().describe("Customer email address"),
    firstName: z.string().optional().describe("Customer first name"),
    lastName: z.string().optional().describe("Customer last name"),
    phoneNumber: z.string().optional().describe("Customer phone number"),
    address1: z.string().optional().describe("Customer address line 1"),
    address2: z.string().optional().describe("Customer address line 2"),
    city: z.string().optional().describe("Customer city"),
    region: z.string().optional().describe("Customer state/region"),
    country: z.string().optional().describe("Customer country"),
    zip: z.string().optional().describe("Customer zip/postal code"),
    organization: z.string().optional().describe("Customer organization"),
    title: z.string().optional().describe("Customer job title"),
    image: z.string().optional().describe("Customer profile image URL"),
    customProperties: z.record(z.any()).optional().describe("Custom properties for the profile"),
  }),
  // Omitting execute function makes this tool require human confirmation
});

/**
 * Get a profile from Klaviyo by email
 * This executes automatically as it's just reading data
 */
const getKlaviyoProfile = tool({
  description: "Get a customer profile from Klaviyo by email address",
  parameters: z.object({
    email: z.string().email().describe("Customer email address to look up"),
  }),
  execute: async ({ email }: { email: string }) => {
    try {
      const apiKey = process.env.KLAVIYO_API_KEY || '';
      
      // Debug logging (remove in production)
      console.log('Klaviyo API Key length:', apiKey.length);
      console.log('Klaviyo API Key starts with:', apiKey.substring(0, 3));
      
      if (!apiKey) {
        throw new Error('KLAVIYO_API_KEY environment variable is not set');
      }

      const response = await fetch(`https://a.klaviyo.com/api/v2/people/search?email=${encodeURIComponent(email)}`, {
        headers: {
          'Authorization': `Klaviyo-API-Key ${apiKey}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Revision': '2025-07-15'
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Klaviyo API Error Details:', {
          status: response.status,
          statusText: response.statusText,
          body: errorText
        });
        throw new Error(`Klaviyo API error: ${response.status} ${response.statusText} - ${errorText}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Error getting Klaviyo profile", error);
      return `Error getting profile: ${error}`;
    }
  },
});

/**
 * Update a profile in Klaviyo
 * This requires human confirmation as it modifies customer data
 */
const updateKlaviyoProfile = tool({
  description: "Update an existing customer profile in Klaviyo",
  parameters: z.object({
    email: z.string().email().describe("Customer email address to update"),
    firstName: z.string().optional().describe("Customer first name"),
    lastName: z.string().optional().describe("Customer last name"),
    phoneNumber: z.string().optional().describe("Customer phone number"),
    address1: z.string().optional().describe("Customer address line 1"),
    address2: z.string().optional().describe("Customer address line 2"),
    city: z.string().optional().describe("Customer city"),
    region: z.string().optional().describe("Customer state/region"),
    country: z.string().optional().describe("Customer country"),
    zip: z.string().optional().describe("Customer zip/postal code"),
    organization: z.string().optional().describe("Customer organization"),
    title: z.string().optional().describe("Customer job title"),
    image: z.string().optional().describe("Customer profile image URL"),
    customProperties: z.record(z.any()).optional().describe("Custom properties for the profile"),
  }),
  // Omitting execute function makes this tool require human confirmation
});

/**
 * Get all lists from Klaviyo
 * This executes automatically as it's just reading data
 */
const getKlaviyoLists = tool({
  description: "Get all lists from Klaviyo account",
  parameters: z.object({}),
  execute: async () => {
    try {
      const response = await fetch('https://a.klaviyo.com/api/v2/lists', {
        headers: {
          'Authorization': `Klaviyo-API-Key ${process.env.KLAVIYO_API_KEY || ''}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Revision': '2025-07-15'
        }
      });

      if (!response.ok) {
        throw new Error(`Klaviyo API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Error getting Klaviyo lists", error);
      return `Error getting lists: ${error}`;
    }
  },
});

/**
 * Create a new list in Klaviyo
 * This requires human confirmation as it creates new data
 */
const createKlaviyoList = tool({
  description: "Create a new list in Klaviyo",
  parameters: z.object({
    name: z.string().describe("Name of the list to create"),
    description: z.string().optional().describe("Description of the list"),
  }),
  // Omitting execute function makes this tool require human confirmation
});

/**
 * Add a profile to a list in Klaviyo
 * This requires human confirmation as it modifies list membership
 */
const addProfileToList = tool({
  description: "Add a customer profile to a specific list in Klaviyo",
  parameters: z.object({
    email: z.string().email().describe("Customer email address to add to list"),
    listId: z.string().describe("ID of the list to add the profile to"),
  }),
  // Omitting execute function makes this tool require human confirmation
});

/**
 * Remove a profile from a list in Klaviyo
 * This requires human confirmation as it modifies list membership
 */
const removeProfileFromList = tool({
  description: "Remove a customer profile from a specific list in Klaviyo",
  parameters: z.object({
    email: z.string().email().describe("Customer email address to remove from list"),
    listId: z.string().describe("ID of the list to remove the profile from"),
  }),
  // Omitting execute function makes this tool require human confirmation
});

/**
 * Get campaigns from Klaviyo
 * This executes automatically as it's just reading data
 */
const getKlaviyoCampaigns = tool({
  description: "Get all campaigns from Klaviyo account",
  parameters: z.object({
    limit: z.number().optional().describe("Number of campaigns to return (default: 50)"),
  }),
  execute: async ({ limit = 50 }: { limit?: number }) => {
    try {
      const response = await fetch(`https://a.klaviyo.com/api/v2/campaigns?count=${limit}`, {
        headers: {
          'Authorization': `Klaviyo-API-Key ${process.env.KLAVIYO_API_KEY || ''}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Revision': '2025-07-15'
        }
      });

      if (!response.ok) {
        throw new Error(`Klaviyo API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Error getting Klaviyo campaigns", error);
      return `Error getting campaigns: ${error}`;
    }
  },
});

/**
 * Send a campaign in Klaviyo
 * This requires human confirmation as it sends emails to customers
 */
const sendKlaviyoCampaign = tool({
  description: "Send a campaign in Klaviyo",
  parameters: z.object({
    campaignId: z.string().describe("ID of the campaign to send"),
  }),
  // Omitting execute function makes this tool require human confirmation
});

/**
 * Get metrics from Klaviyo
 * This executes automatically as it's just reading data
 */
const getKlaviyoMetrics = tool({
  description: "Get metrics from Klaviyo account",
  parameters: z.object({
    metricId: z.string().optional().describe("Specific metric ID to retrieve"),
    since: z.string().optional().describe("Start date for metrics (ISO 8601 format)"),
    until: z.string().optional().describe("End date for metrics (ISO 8601 format)"),
  }),
  execute: async ({ metricId, since, until }: { metricId?: string; since?: string; until?: string }) => {
    try {
      let url = 'https://a.klaviyo.com/api/v2/metrics';
      if (metricId) {
        url = `https://a.klaviyo.com/api/v2/metric/${metricId}`;
      }
      
      const params = new URLSearchParams();
      if (since) params.append('since', since);
      if (until) params.append('until', until);
      
      if (params.toString()) {
        url += `?${params.toString()}`;
      }

      const response = await fetch(url, {
        headers: {
          'Authorization': `Klaviyo-API-Key ${process.env.KLAVIYO_API_KEY || ''}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Revision': '2025-07-15'
        }
      });

      if (!response.ok) {
        throw new Error(`Klaviyo API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Error getting Klaviyo metrics", error);
      return `Error getting metrics: ${error}`;
    }
  },
});

/**
 * Export all available tools
 * These will be provided to the AI model to describe available capabilities
 */
export const tools = {
  getWeatherInformation,
  getLocalTime,
  scheduleTask,
  getScheduledTasks,
  cancelScheduledTask,
  // Klaviyo tools
  createKlaviyoProfile,
  getKlaviyoProfile,
  updateKlaviyoProfile,
  getKlaviyoLists,
  createKlaviyoList,
  addProfileToList,
  removeProfileFromList,
  getKlaviyoCampaigns,
  sendKlaviyoCampaign,
  getKlaviyoMetrics,
};

/**
 * Implementation of confirmation-required tools
 * This object contains the actual logic for tools that need human approval
 * Each function here corresponds to a tool above that doesn't have an execute function
 * NOTE: keys below should match toolsRequiringConfirmation in app.tsx
 */
export const executions = {
  getWeatherInformation: async ({ city }: { city: string }) => {
    console.log(`Getting weather information for ${city}`);
    return `The weather in ${city} is sunny`;
  },
  createKlaviyoProfile: async (params: {
    email: string;
    firstName?: string;
    lastName?: string;
    phoneNumber?: string;
    address1?: string;
    address2?: string;
    city?: string;
    region?: string;
    country?: string;
    zip?: string;
    organization?: string;
    title?: string;
    image?: string;
    customProperties?: Record<string, any>;
  }) => {
    try {
      const profileData = {
        data: {
          type: "profile",
          attributes: {
            email: params.email,
            ...(params.firstName && { first_name: params.firstName }),
            ...(params.lastName && { last_name: params.lastName }),
            ...(params.phoneNumber && { phone_number: params.phoneNumber }),
            ...(params.address1 && { address1: params.address1 }),
            ...(params.address2 && { address2: params.address2 }),
            ...(params.city && { city: params.city }),
            ...(params.region && { region: params.region }),
            ...(params.country && { country: params.country }),
            ...(params.zip && { zip: params.zip }),
            ...(params.organization && { organization: params.organization }),
            ...(params.title && { title: params.title }),
            ...(params.image && { image: params.image }),
            ...(params.customProperties && { $extra: params.customProperties }),
          }
        }
      };

      const response = await fetch('https://a.klaviyo.com/api/profiles/', {
        method: 'POST',
        headers: {
          'Authorization': `Klaviyo-API-Key ${process.env.KLAVIYO_API_KEY || ''}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Revision': '2025-07-15'
        },
        body: JSON.stringify(profileData)
      });

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`Klaviyo API error: ${response.status} ${response.statusText} - ${errorData}`);
      }

      const data = await response.json() as any;
      return `Profile created successfully for ${params.email}. Profile ID: ${data.data.id}`;
    } catch (error) {
      console.error("Error creating Klaviyo profile", error);
      return `Error creating profile: ${error}`;
    }
  },
  updateKlaviyoProfile: async (params: {
    email: string;
    firstName?: string;
    lastName?: string;
    phoneNumber?: string;
    address1?: string;
    address2?: string;
    city?: string;
    region?: string;
    country?: string;
    zip?: string;
    organization?: string;
    title?: string;
    image?: string;
    customProperties?: Record<string, any>;
  }) => {
    try {
      // First, get the profile ID by email
      const searchResponse = await fetch(`https://a.klaviyo.com/api/v2/people/search?email=${encodeURIComponent(params.email)}`, {
        headers: {
          'Authorization': `Klaviyo-API-Key ${process.env.KLAVIYO_API_KEY || ''}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Revision': '2025-07-15'
        }
      });

      if (!searchResponse.ok) {
        throw new Error(`Error finding profile: ${searchResponse.status} ${searchResponse.statusText}`);
      }

      const searchData = await searchResponse.json() as any[];
      if (!searchData.length) {
        throw new Error(`Profile not found for email: ${params.email}`);
      }

      const profileId = searchData[0].id;

      const updateData = {
        data: {
          type: "profile",
          id: profileId,
          attributes: {
            ...(params.firstName && { first_name: params.firstName }),
            ...(params.lastName && { last_name: params.lastName }),
            ...(params.phoneNumber && { phone_number: params.phoneNumber }),
            ...(params.address1 && { address1: params.address1 }),
            ...(params.address2 && { address2: params.address2 }),
            ...(params.city && { city: params.city }),
            ...(params.region && { region: params.region }),
            ...(params.country && { country: params.country }),
            ...(params.zip && { zip: params.zip }),
            ...(params.organization && { organization: params.organization }),
            ...(params.title && { title: params.title }),
            ...(params.image && { image: params.image }),
            ...(params.customProperties && { $extra: params.customProperties }),
          }
        }
      };

      const response = await fetch(`https://a.klaviyo.com/api/profiles/${profileId}/`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Klaviyo-API-Key ${process.env.KLAVIYO_API_KEY || ''}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Revision': '2025-07-15'
        },
        body: JSON.stringify(updateData)
      });

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`Klaviyo API error: ${response.status} ${response.statusText} - ${errorData}`);
      }

      return `Profile updated successfully for ${params.email}`;
    } catch (error) {
      console.error("Error updating Klaviyo profile", error);
      return `Error updating profile: ${error}`;
    }
  },
  createKlaviyoList: async (params: { name: string; description?: string }) => {
    try {
      const listData = {
        data: {
          type: "list",
          attributes: {
            name: params.name,
            ...(params.description && { description: params.description }),
          }
        }
      };

      const response = await fetch('https://a.klaviyo.com/api/lists/', {
        method: 'POST',
        headers: {
          'Authorization': `Klaviyo-API-Key ${process.env.KLAVIYO_API_KEY || ''}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Revision': '2025-07-15'
        },
        body: JSON.stringify(listData)
      });

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`Klaviyo API error: ${response.status} ${response.statusText} - ${errorData}`);
      }

      const data = await response.json() as any;
      return `List created successfully: ${params.name}. List ID: ${data.data.id}`;
    } catch (error) {
      console.error("Error creating Klaviyo list", error);
      return `Error creating list: ${error}`;
    }
  },
  addProfileToList: async (params: { email: string; listId: string }) => {
    try {
      // First, get the profile ID by email
      const searchResponse = await fetch(`https://a.klaviyo.com/api/v2/people/search?email=${encodeURIComponent(params.email)}`, {
        headers: {
          'Authorization': `Klaviyo-API-Key ${process.env.KLAVIYO_API_KEY || ''}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Revision': '2025-07-15'
        }
      });

      if (!searchResponse.ok) {
        throw new Error(`Error finding profile: ${searchResponse.status} ${searchResponse.statusText}`);
      }

      const searchData = await searchResponse.json() as any[];
      if (!searchData.length) {
        throw new Error(`Profile not found for email: ${params.email}`);
      }

      const profileId = searchData[0].id;

      const subscriptionData = {
        data: {
          type: "subscription",
          attributes: {
            profile_id: profileId,
            custom_source: "API"
          }
        }
      };

      const response = await fetch(`https://a.klaviyo.com/api/lists/${params.listId}/subscriptions/`, {
        method: 'POST',
        headers: {
          'Authorization': `Klaviyo-API-Key ${process.env.KLAVIYO_API_KEY || ''}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Revision': '2025-07-15'
        },
        body: JSON.stringify(subscriptionData)
      });

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`Klaviyo API error: ${response.status} ${response.statusText} - ${errorData}`);
      }

      return `Profile ${params.email} added to list ${params.listId} successfully`;
    } catch (error) {
      console.error("Error adding profile to list", error);
      return `Error adding profile to list: ${error}`;
    }
  },
  removeProfileFromList: async (params: { email: string; listId: string }) => {
    try {
      // First, get the profile ID by email
      const searchResponse = await fetch(`https://a.klaviyo.com/api/v2/people/search?email=${encodeURIComponent(params.email)}`, {
        headers: {
          'Authorization': `Klaviyo-API-Key ${process.env.KLAVIYO_API_KEY || ''}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Revision': '2025-07-15'
        }
      });

      if (!searchResponse.ok) {
        throw new Error(`Error finding profile: ${searchResponse.status} ${searchResponse.statusText}`);
      }

      const searchData = await searchResponse.json() as any[];
      if (!searchData.length) {
        throw new Error(`Profile not found for email: ${params.email}`);
      }

      const profileId = searchData[0].id;

      const response = await fetch(`https://a.klaviyo.com/api/lists/${params.listId}/subscriptions/${profileId}/`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Klaviyo-API-Key ${process.env.KLAVIYO_API_KEY || ''}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Revision': '2025-07-15'
        }
      });

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`Klaviyo API error: ${response.status} ${response.statusText} - ${errorData}`);
      }

      return `Profile ${params.email} removed from list ${params.listId} successfully`;
    } catch (error) {
      console.error("Error removing profile from list", error);
      return `Error removing profile from list: ${error}`;
    }
  },
  sendKlaviyoCampaign: async (params: { campaignId: string }) => {
    try {
      const response = await fetch(`https://a.klaviyo.com/api/v2/campaign/${params.campaignId}/send`, {
        method: 'POST',
        headers: {
          'Authorization': `Klaviyo-API-Key ${process.env.KLAVIYO_API_KEY || ''}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Revision': '2025-07-15'
        }
      });

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`Klaviyo API error: ${response.status} ${response.statusText} - ${errorData}`);
      }

      return `Campaign ${params.campaignId} sent successfully`;
    } catch (error) {
      console.error("Error sending Klaviyo campaign", error);
      return `Error sending campaign: ${error}`;
    }
  },
};
