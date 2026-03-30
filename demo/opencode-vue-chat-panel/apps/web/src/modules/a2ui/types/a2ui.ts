import type { A2uiComponentNode, A2uiServerMessage } from "@demo/shared";

export interface A2uiSurface {
  surfaceId: string;
  catalogId: string;
  components: Record<string, A2uiComponentNode>;
  dataModel: Record<string, unknown>;
  formDraft: Record<string, unknown>;
}
