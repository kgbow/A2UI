import type { AgentUiIntent } from "../types/agent.js";
import type { A2uiServerMessage, A2uiComponentNode } from "../types/a2ui.js";

const BASIC_CATALOG_ID = "https://a2ui.org/specification/v0_9/basic_catalog.json";

export function buildFormSurface(
  surfaceId: string,
  ui: AgentUiIntent,
): A2uiServerMessage[] {
  const fieldNodes: A2uiComponentNode[] = ui.fields.map((field) => ({
    id: `field-${field.name}`,
    component: "TextField",
    label: field.label,
    value: { path: `/${field.name}` },
  }));

  const components: A2uiComponentNode[] = [
    {
      id: "root",
      component: "Column",
      children: [
        "title",
        ...fieldNodes.map((node) => node.id),
        "submit-button",
      ],
    },
    {
      id: "title",
      component: "Text",
      text: { path: "/title" },
    },
    ...fieldNodes,
    {
      id: "submit-button",
      component: "Button",
      child: "submit-text",
      action: {
        event: {
          name: ui.submitAction,
        },
      },
    },
    {
      id: "submit-text",
      component: "Text",
      text: ui.submitLabel,
    },
  ];

  const value: Record<string, unknown> = { title: ui.title };
  for (const field of ui.fields) {
    value[field.name] = field.defaultValue ?? "";
  }

  return [
    {
      version: "v0.9",
      createSurface: {
        surfaceId,
        catalogId: BASIC_CATALOG_ID,
      },
    },
    {
      version: "v0.9",
      updateComponents: {
        surfaceId,
        components,
      },
    },
    {
      version: "v0.9",
      updateDataModel: {
        surfaceId,
        path: "/",
        value,
      },
    },
  ];
}
