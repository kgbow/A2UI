import { z } from "zod";

export const agentUiFieldSchema = z.object({
  name: z.string().min(1).max(40).regex(/^[a-zA-Z][a-zA-Z0-9_]*$/),
  label: z.string().min(1).max(40),
  inputType: z.literal("text"),
  required: z.boolean().optional(),
  defaultValue: z.string().max(200).optional(),
  placeholder: z.string().max(80).optional(),
});

export const agentUiIntentSchema = z.object({
  type: z.literal("form"),
  title: z.string().min(1).max(80),
  description: z.string().max(200).optional(),
  submitLabel: z.string().min(1).max(30),
  submitAction: z.enum(["submit_booking", "confirm_selection"]),
  fields: z.array(agentUiFieldSchema).min(1).max(6),
});

export const agentStructuredResponseSchema = z.object({
  replyText: z.string().min(1).max(2000),
  uiIntent: agentUiIntentSchema.optional(),
});
