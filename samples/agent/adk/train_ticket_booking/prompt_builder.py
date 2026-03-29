# Copyright 2026 Google LLC
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

from a2ui.core.schema.constants import VERSION_0_9
from a2ui.core.schema.manager import A2uiSchemaManager
from a2ui.basic_catalog.provider import BasicCatalog
from a2ui.core.schema.common_modifiers import remove_strict_validation

ROLE_DESCRIPTION = (
    "You are a helpful train ticket booking assistant. Your final output MUST be an"
    " a2ui UI JSON response when the A2UI extension is active."
)

UI_DESCRIPTION = """
- If the request starts the workflow, you MUST use the SEARCH_FORM_EXAMPLE template.
- If the user has triggered a train search, you MUST call the `search_trains` tool and use the TRAIN_RESULTS_EXAMPLE template.
- If the user has selected a train seat, you MUST use the PASSENGER_FORM_EXAMPLE template.
- If the user has submitted passenger details for review, you MUST use the BOOKING_REVIEW_EXAMPLE template.
- If the user has confirmed the booking, you MUST call the `book_train_ticket` tool and use the BOOKING_RESULT_EXAMPLE template.
- Keep the workflow on a single surface named `train-booking-wizard`.
"""


def get_text_prompt() -> str:
  """Constructs the prompt for a text-only agent."""
  return """
  You are a helpful train ticket booking assistant. Your final output MUST be a text response.

  To generate the response, you MUST follow these rules:
  1. **For a search request:**
      a. You MUST call the `search_trains` tool. Extract the departure station, arrival station, date, time preference, and train type from the user's query.
      b. After receiving the data, format the train list as a clear, human-readable text response.

  2. **For booking a ticket (when you receive a query like 'SELECT_TRAIN_SEAT...'):**
      a. Respond by asking the user for passenger details (name, ID number, phone number).

  3. **For confirming a booking (when you receive a query like 'CONFIRM_BOOKING...'):**
      a. You MUST call the `book_train_ticket` tool.
      b. Respond with a simple text confirmation including the booking reference.
  """


if __name__ == "__main__":
  # Example of how to use the A2UI Schema Manager to generate a system prompt
  version = VERSION_0_9
  train_prompt = A2uiSchemaManager(
      version,
      catalogs=[
          BasicCatalog.get_config(
              version=version,
              examples_path=f"examples/{version}",
          )
      ],
      schema_modifiers=[remove_strict_validation],
  ).generate_system_prompt(
      role_description=ROLE_DESCRIPTION,
      ui_description=UI_DESCRIPTION,
      include_schema=True,
      include_examples=True,
      validate_examples=False,  # Skip validation due to schema resolution issues
  )

  print(train_prompt)
