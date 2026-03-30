import { describe, expect, it } from "vitest";
import { useA2uiSurface } from "../composables/useA2uiSurface.js";

describe("useA2uiSurface", () => {
  it("returns merged form data when building an action payload", () => {
    const surface = useA2uiSurface([
      {
        version: "v0.9",
        createSurface: { surfaceId: "surface-1", catalogId: "catalog" },
      },
      {
        version: "v0.9",
        updateComponents: {
          surfaceId: "surface-1",
          components: [
            { id: "root", component: "Column", children: ["field-partySize", "submit-button"] },
            { id: "field-partySize", component: "TextField", label: "Party Size", value: { path: "/partySize" } },
            { id: "submit-button", component: "Button", child: "submit-text", action: { event: { name: "submit_booking" } } },
            { id: "submit-text", component: "Text", text: "Submit" },
          ],
        },
      },
      {
        version: "v0.9",
        updateDataModel: {
          surfaceId: "surface-1",
          path: "/",
          value: { partySize: "2" },
        },
      },
    ]);

    surface.setDraftValue("partySize", "4");

    const buttonNode = surface.getNode("submit-button")!;
    const payload = surface.buildActionPayload(buttonNode);

    expect(payload.actionName).toBe("submit_booking");
    expect(payload.formData.partySize).toBe("4");
  });
});
