import A2uiColumn from "../widgets/A2uiColumn.vue";
import A2uiRow from "../widgets/A2uiRow.vue";
import A2uiText from "../widgets/A2uiText.vue";
import A2uiTextField from "../widgets/A2uiTextField.vue";
import A2uiButton from "../widgets/A2uiButton.vue";

export const registry = {
  Column: A2uiColumn,
  Row: A2uiRow,
  Text: A2uiText,
  TextField: A2uiTextField,
  Button: A2uiButton,
} as const;

export type A2uiComponentType = keyof typeof registry;
