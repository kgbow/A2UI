import { computed, reactive } from "vue";
import type { A2uiComponentNode, A2uiServerMessage } from "@demo/shared";

function pathToKey(path: string): string {
  return path.replace(/^\//, "");
}

export function useA2uiSurface(messages: A2uiServerMessage[]) {
  const state = reactive({
    surfaceId: "",
    catalogId: "",
    components: {} as Record<string, A2uiComponentNode>,
    dataModel: {} as Record<string, unknown>,
    formDraft: {} as Record<string, unknown>,
  });

  for (const message of messages) {
    if ("createSurface" in message) {
      state.surfaceId = message.createSurface.surfaceId;
      state.catalogId = message.createSurface.catalogId;
    }
    if ("updateComponents" in message) {
      state.components = Object.fromEntries(
        message.updateComponents.components.map((node) => [node.id, node]),
      );
    }
    if ("updateDataModel" in message) {
      state.dataModel = { ...message.updateDataModel.value };
      state.formDraft = {};
    }
  }

  return {
    state,
    rootNode: computed(() => state.components.root),
    getNode(id: string) {
      return state.components[id];
    },
    getValue(ref?: { path: string } | string) {
      if (!ref) return undefined;
      if (typeof ref === "string") return ref;
      const key = pathToKey(ref.path);
      return key in state.formDraft ? state.formDraft[key] : state.dataModel[key];
    },
    setDraftValue(name: string, value: unknown) {
      state.formDraft[name] = value;
    },
    buildActionPayload(node: A2uiComponentNode) {
      return {
        surfaceId: state.surfaceId,
        componentId: node.id,
        actionName: node.action?.event.name ?? "submit_booking",
        formData: {
          ...state.dataModel,
          ...state.formDraft,
        },
      };
    },
  };
}
