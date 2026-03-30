export interface AgentUiField {
  name: string;
  label: string;
  inputType: "text";
  required?: boolean;
  defaultValue?: string;
  placeholder?: string;
}

export interface AgentUiIntent {
  type: "form";
  title: string;
  description?: string;
  submitLabel: string;
  submitAction: "submit_booking" | "confirm_selection";
  fields: AgentUiField[];
}

export interface AgentStructuredResponse {
  replyText: string;
  uiIntent?: AgentUiIntent;
}
