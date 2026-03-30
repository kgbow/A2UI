export type A2uiComponentType = "Column" | "Row" | "Text" | "TextField" | "Button";

export interface A2uiComponentNode {
  id: string;
  component: A2uiComponentType;
  children?: string[];
  child?: string;
  text?: string | { path: string };
  label?: string;
  value?: { path: string };
  action?: {
    event: {
      name: "submit_booking" | "confirm_selection";
      context?: Record<string, { path: string }>;
    };
  };
}

export interface A2uiCreateSurfaceMessage {
  version: "v0.9";
  createSurface: {
    surfaceId: string;
    catalogId: string;
  };
}

export interface A2uiUpdateComponentsMessage {
  version: "v0.9";
  updateComponents: {
    surfaceId: string;
    components: A2uiComponentNode[];
  };
}

export interface A2uiUpdateDataModelMessage {
  version: "v0.9";
  updateDataModel: {
    surfaceId: string;
    path: string;
    value: Record<string, unknown>;
  };
}

export type A2uiServerMessage =
  | A2uiCreateSurfaceMessage
  | A2uiUpdateComponentsMessage
  | A2uiUpdateDataModelMessage;
