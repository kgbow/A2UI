import { describe, expect, it } from "vitest";
import { buildFormSurface } from "./a2ui";
import type { AgentUiIntent } from "../types/agent";

describe("buildFormSurface", () => {
  it("builds a createSurface + updateComponents + updateDataModel sequence", () => {
    const ui: AgentUiIntent = {
      type: "form",
      title: "Restaurant booking",
      submitLabel: "Submit",
      submitAction: "submit_booking",
      fields: [
        {
          name: "partySize",
          label: "Party Size",
          inputType: "text",
          defaultValue: "2",
        },
      ],
    };

    const messages = buildFormSurface("surface-1", ui);

    expect(messages).toHaveLength(3);
    expect(messages[0]).toHaveProperty("createSurface.surfaceId", "surface-1");
    expect(messages[1]).toHaveProperty("updateComponents.components.0.component", "Column");
    expect(messages[2]).toHaveProperty("updateDataModel.value.partySize", "2");
  });
});
