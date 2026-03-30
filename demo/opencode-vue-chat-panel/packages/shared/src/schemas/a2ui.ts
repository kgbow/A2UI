import { z } from "zod";

export const a2uiComponentTypeSchema = z.enum([
  "Column",
  "Row",
  "Text",
  "TextField",
  "Button",
]);

export const a2uiComponentNodeSchema = z.object({
  id: z.string().min(1),
  component: a2uiComponentTypeSchema,
  children: z.array(z.string()).optional(),
  child: z.string().optional(),
  text: z.union([z.string(), z.object({ path: z.string() })]).optional(),
  label: z.string().optional(),
  value: z.object({ path: z.string() }).optional(),
  action: z
    .object({
      event: z.object({
        name: z.enum(["submit_booking", "confirm_selection"]),
        context: z.record(z.object({ path: z.string() })).optional(),
      }),
    })
    .optional(),
});

export const a2uiCreateSurfaceSchema = z.object({
  version: z.literal("v0.9"),
  createSurface: z.object({
    surfaceId: z.string().min(1),
    catalogId: z.string().url(),
  }),
});

export const a2uiUpdateComponentsSchema = z.object({
  version: z.literal("v0.9"),
  updateComponents: z.object({
    surfaceId: z.string().min(1),
    components: z.array(a2uiComponentNodeSchema),
  }),
});

export const a2uiUpdateDataModelSchema = z.object({
  version: z.literal("v0.9"),
  updateDataModel: z.object({
    surfaceId: z.string().min(1),
    path: z.string().min(1),
    value: z.record(z.unknown()),
  }),
});

export const a2uiServerMessageSchema = z.union([
  a2uiCreateSurfaceSchema,
  a2uiUpdateComponentsSchema,
  a2uiUpdateDataModelSchema,
]);
