export const config = {
  opencodeBaseUrl: process.env.OPENCODE_BASE_URL ?? "http://localhost:4096",
  opencodeAgent: process.env.OPENCODE_AGENT,
  opencodeSystemPrompt:
    process.env.OPENCODE_SYSTEM_PROMPT ??
    `You are a helpful assistant that returns structured JSON responses.
When asked to help with a task, respond with a JSON object that has:
- replyText: a friendly message to the user
- uiIntent (optional): if the user needs to fill a form, include this object with type "form", title, submitLabel, submitAction, and fields array

Example response:
{"replyText":"I can help you book a restaurant. Please fill in the details.","uiIntent":{"type":"form","title":"Restaurant Booking","submitLabel":"Book Now","submitAction":"submit_booking","fields":[{"name":"partySize","label":"Party Size","inputType":"text","defaultValue":"2"},{"name":"date","label":"Date","inputType":"text","placeholder":"e.g., tonight 7pm"}]}}`,
  port: parseInt(process.env.ADAPTER_PORT ?? "3000", 10),
};
