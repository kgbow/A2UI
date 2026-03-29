# Train Ticket Booking Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a new ADK sample that demonstrates a train ticket booking flow where the agent generates and updates A2UI surfaces and uses an OpenAI-compatible API interface.

**Architecture:** Create a new sample at `samples/agent/adk/train_ticket_booking/` by adapting the `restaurant_finder` structure. Keep the workflow on a single `train-booking-wizard` surface, route UI events through the executor, use deterministic local mock tools for train search and booking, and wire the LLM through OpenAI-compatible environment variables while still using the repo's existing ADK runner pattern.

**Tech Stack:** Python, Google ADK sample structure, A2A server, A2UI schema manager, local JSON mock data, pytest, OpenAI-compatible chat/completions configuration via environment variables.

---

## File Map

### New sample files

- Create: `samples/agent/adk/train_ticket_booking/__init__.py`
- Create: `samples/agent/adk/train_ticket_booking/__main__.py`
- Create: `samples/agent/adk/train_ticket_booking/README.md`
- Create: `samples/agent/adk/train_ticket_booking/.env.example`
- Create: `samples/agent/adk/train_ticket_booking/pyproject.toml`
- Create: `samples/agent/adk/train_ticket_booking/agent.py`
- Create: `samples/agent/adk/train_ticket_booking/agent_executor.py`
- Create: `samples/agent/adk/train_ticket_booking/prompt_builder.py`
- Create: `samples/agent/adk/train_ticket_booking/tools.py`
- Create: `samples/agent/adk/train_ticket_booking/train_data.json`
- Create: `samples/agent/adk/train_ticket_booking/examples/0.9/search_form.json`
- Create: `samples/agent/adk/train_ticket_booking/examples/0.9/train_results.json`
- Create: `samples/agent/adk/train_ticket_booking/examples/0.9/passenger_form.json`
- Create: `samples/agent/adk/train_ticket_booking/examples/0.9/booking_review.json`
- Create: `samples/agent/adk/train_ticket_booking/examples/0.9/booking_result.json`

### Shared test updates

- Modify: `samples/agent/adk/tests/test_examples_validation.py`

## Task 1: Scaffold The New Sample Directory

**Files:**
- Create: `samples/agent/adk/train_ticket_booking/__init__.py`
- Create: `samples/agent/adk/train_ticket_booking/__main__.py`
- Create: `samples/agent/adk/train_ticket_booking/README.md`
- Create: `samples/agent/adk/train_ticket_booking/.env.example`
- Create: `samples/agent/adk/train_ticket_booking/pyproject.toml`

- [ ] **Step 1: Inspect the restaurant sample package metadata and startup wiring**

Run: `Get-Content samples/agent/adk/restaurant_finder/pyproject.toml`
Run: `Get-Content samples/agent/adk/restaurant_finder/__main__.py`
Expected: Existing package name, dependencies, and server startup pattern are visible.

- [ ] **Step 2: Write the package metadata by adapting the restaurant sample**

Create `samples/agent/adk/train_ticket_booking/pyproject.toml` with:

```toml
[project]
name = "train-ticket-booking"
version = "0.1.0"
description = "A2UI train ticket booking sample using an OpenAI-compatible API"
requires-python = ">=3.11"
dependencies = [
  "a2a-sdk>=0.2.8",
  "a2ui-agent>=0.9.0",
  "click>=8.2.1",
  "google-adk>=1.20.0",
  "jsonschema>=4.25.1",
  "litellm>=1.76.1",
  "python-dotenv>=1.1.1",
  "starlette>=0.47.3",
  "uvicorn>=0.35.0",
]

[project.scripts]
train-ticket-booking = "train_ticket_booking.__main__:main"

[build-system]
requires = ["setuptools>=80.9.0"]
build-backend = "setuptools.build_meta"
```

- [ ] **Step 3: Create the package marker**

Create `samples/agent/adk/train_ticket_booking/__init__.py` with:

```python
"""Train ticket booking ADK sample."""
```

- [ ] **Step 4: Write the startup entrypoint with OpenAI-compatible env validation**

Create `samples/agent/adk/train_ticket_booking/__main__.py` with:

```python
import logging
import os

import click
from a2a.server.apps import A2AStarletteApplication
from a2a.server.request_handlers import DefaultRequestHandler
from a2a.server.tasks import InMemoryTaskStore
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware

from agent import TrainTicketBookingAgent
from agent_executor import TrainTicketBookingAgentExecutor

load_dotenv()

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class MissingAPIConfigurationError(Exception):
  """Raised when the OpenAI-compatible configuration is incomplete."""


@click.command()
@click.option("--host", default="localhost")
@click.option("--port", default=10012)
def main(host, port):
  try:
    if not os.getenv("OPENAI_API_KEY"):
      raise MissingAPIConfigurationError("OPENAI_API_KEY environment variable not set.")
    if not os.getenv("OPENAI_MODEL"):
      raise MissingAPIConfigurationError("OPENAI_MODEL environment variable not set.")

    base_url = f"http://{host}:{port}"
    agent = TrainTicketBookingAgent(base_url=base_url)
    agent_executor = TrainTicketBookingAgentExecutor(agent)

    request_handler = DefaultRequestHandler(
        agent_executor=agent_executor,
        task_store=InMemoryTaskStore(),
    )
    server = A2AStarletteApplication(
        agent_card=agent.agent_card,
        http_handler=request_handler,
    )

    import uvicorn

    app = server.build()
    app.add_middleware(
        CORSMiddleware,
        allow_origin_regex=r"http://localhost:\d+",
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    uvicorn.run(app, host=host, port=port)
  except MissingAPIConfigurationError as exc:
    logger.error("Error: %s", exc)
    raise SystemExit(1)
  except Exception as exc:
    logger.error("An error occurred during server startup: %s", exc)
    raise SystemExit(1)


if __name__ == "__main__":
  main()
```

- [ ] **Step 5: Write the environment template**

Create `samples/agent/adk/train_ticket_booking/.env.example` with:

```dotenv
OPENAI_API_KEY=your_api_key_here
OPENAI_MODEL=openai/gpt-4.1-mini
# Optional for compatible providers:
OPENAI_BASE_URL=https://api.openai.com/v1
```

- [ ] **Step 6: Write the sample README**

Create `samples/agent/adk/train_ticket_booking/README.md` with:

```md
# A2UI Train Ticket Booking Sample

This sample demonstrates a train ticket booking workflow where the agent generates
and updates A2UI surfaces based on user actions.

## Prerequisites

- Python 3.11+
- UV
- An OpenAI-compatible API key

## Setup

```bash
cd samples/agent/adk/train_ticket_booking
cp .env.example .env
```

Set:

- `OPENAI_API_KEY`
- `OPENAI_MODEL`
- optional `OPENAI_BASE_URL`

## Run

```bash
uv run .
```

## Demo Flow

1. Send a natural-language booking request.
2. Confirm the generated search form.
3. Search trains.
4. Select a train and seat type.
5. Fill in passenger details.
6. Review and confirm the booking.
7. Receive a generated success surface.
```

- [ ] **Step 7: Run the module entrypoint help to verify the package is wired**

Run: `cd samples/agent/adk/train_ticket_booking; uv run python -m train_ticket_booking --help`
Expected: Click shows `--host` and `--port` options without import errors.

- [ ] **Step 8: Commit the scaffold**

```bash
git add samples/agent/adk/train_ticket_booking/__init__.py samples/agent/adk/train_ticket_booking/__main__.py samples/agent/adk/train_ticket_booking/README.md samples/agent/adk/train_ticket_booking/.env.example samples/agent/adk/train_ticket_booking/pyproject.toml
git commit -m "feat: scaffold train ticket booking sample"
```

## Task 2: Add Deterministic Train Search And Booking Tools

**Files:**
- Create: `samples/agent/adk/train_ticket_booking/tools.py`
- Create: `samples/agent/adk/train_ticket_booking/train_data.json`

- [ ] **Step 1: Write the failing tool tests in a temporary local scratch file**

Create a temporary test file `samples/agent/adk/train_ticket_booking/test_tools_local.py` with:

```python
import json

from tools import book_train_ticket, search_trains


class DummyToolContext:
  def __init__(self):
    self.state = {}


def test_search_trains_returns_matching_route():
  result = json.loads(
      search_trains(
          from_station="Shanghai",
          to_station="Beijing",
          departure_date="2026-03-30",
          time_preference="morning",
          train_type="high-speed",
          tool_context=DummyToolContext(),
      )
  )
  assert result
  assert all(item["from"] == "Shanghai" for item in result)
  assert all(item["to"] == "Beijing" for item in result)


def test_book_train_ticket_returns_success_payload():
  result = json.loads(
      book_train_ticket(
          train_id="G101",
          seat_type="Second Class",
          passenger_name="Kevin Zhang",
          passenger_id="310101199901011234",
          phone_number="13800138000",
          tool_context=DummyToolContext(),
      )
  )
  assert result["status"] == "success"
  assert result["bookingReference"].startswith("TTB-")
```

- [ ] **Step 2: Run the local tool tests to verify they fail**

Run: `cd samples/agent/adk/train_ticket_booking; uv run pytest test_tools_local.py -q`
Expected: FAIL because `tools.py` does not exist yet.

- [ ] **Step 3: Create deterministic mock train data**

Create `samples/agent/adk/train_ticket_booking/train_data.json` with:

```json
[
  {
    "trainId": "G101",
    "trainNumber": "G101",
    "from": "Shanghai",
    "to": "Beijing",
    "departureTime": "08:00",
    "arrivalTime": "12:38",
    "duration": "4h 38m",
    "date": "2026-03-30",
    "trainType": "high-speed",
    "seatOptions": [
      { "seatType": "Second Class", "price": 553, "remaining": 12 },
      { "seatType": "First Class", "price": 933, "remaining": 6 }
    ]
  },
  {
    "trainId": "G115",
    "trainNumber": "G115",
    "from": "Shanghai",
    "to": "Beijing",
    "departureTime": "09:12",
    "arrivalTime": "13:58",
    "duration": "4h 46m",
    "date": "2026-03-30",
    "trainType": "high-speed",
    "seatOptions": [
      { "seatType": "Second Class", "price": 568, "remaining": 9 },
      { "seatType": "First Class", "price": 948, "remaining": 4 }
    ]
  },
  {
    "trainId": "D301",
    "trainNumber": "D301",
    "from": "Shanghai",
    "to": "Beijing",
    "departureTime": "14:20",
    "arrivalTime": "21:50",
    "duration": "7h 30m",
    "date": "2026-03-30",
    "trainType": "bullet",
    "seatOptions": [
      { "seatType": "Second Class", "price": 432, "remaining": 18 },
      { "seatType": "First Class", "price": 712, "remaining": 5 }
    ]
  }
]
```

- [ ] **Step 4: Implement the mock tools**

Create `samples/agent/adk/train_ticket_booking/tools.py` with:

```python
import json
import os
import uuid

from google.adk.tools.tool_context import ToolContext


def _load_trains():
  file_path = os.path.join(os.path.dirname(__file__), "train_data.json")
  with open(file_path, encoding="utf-8") as handle:
    return json.load(handle)


def search_trains(
    from_station: str,
    to_station: str,
    departure_date: str,
    time_preference: str,
    train_type: str,
    tool_context: ToolContext,
) -> str:
  del tool_context
  trains = _load_trains()
  matches = []
  for train in trains:
    if train["from"].lower() != from_station.lower():
      continue
    if train["to"].lower() != to_station.lower():
      continue
    if train["date"] != departure_date:
      continue
    if train_type and train_type.lower() not in ("all", train["trainType"].lower()):
      continue
    if time_preference.lower() == "morning" and int(train["departureTime"][:2]) >= 12:
      continue
    matches.append(train)
  return json.dumps(matches)


def book_train_ticket(
    train_id: str,
    seat_type: str,
    passenger_name: str,
    passenger_id: str,
    phone_number: str,
    tool_context: ToolContext,
) -> str:
  del tool_context
  trains = _load_trains()
  selected_train = next(train for train in trains if train["trainId"] == train_id)
  selected_seat = next(
      seat for seat in selected_train["seatOptions"] if seat["seatType"] == seat_type
  )
  return json.dumps(
      {
          "status": "success",
          "bookingReference": f"TTB-{uuid.uuid4().hex[:8].upper()}",
          "passengerName": passenger_name,
          "passengerId": passenger_id,
          "phone": phone_number,
          "selectedTrain": selected_train,
          "selectedSeatType": seat_type,
          "finalPrice": selected_seat["price"],
      }
  )
```

- [ ] **Step 5: Run the local tool tests to verify they pass**

Run: `cd samples/agent/adk/train_ticket_booking; uv run pytest test_tools_local.py -q`
Expected: `2 passed`

- [ ] **Step 6: Delete the temporary local test file after using it to drive implementation**

Run: `Remove-Item samples/agent/adk/train_ticket_booking/test_tools_local.py`
Expected: Temporary test file is removed so only repo-appropriate tests remain.

- [ ] **Step 7: Commit the tools and mock data**

```bash
git add samples/agent/adk/train_ticket_booking/tools.py samples/agent/adk/train_ticket_booking/train_data.json
git commit -m "feat: add train ticket booking mock tools"
```

## Task 3: Author The A2UI Example Templates

**Files:**
- Create: `samples/agent/adk/train_ticket_booking/examples/0.9/search_form.json`
- Create: `samples/agent/adk/train_ticket_booking/examples/0.9/train_results.json`
- Create: `samples/agent/adk/train_ticket_booking/examples/0.9/passenger_form.json`
- Create: `samples/agent/adk/train_ticket_booking/examples/0.9/booking_review.json`
- Create: `samples/agent/adk/train_ticket_booking/examples/0.9/booking_result.json`
- Modify: `samples/agent/adk/tests/test_examples_validation.py`

- [ ] **Step 1: Inspect the restaurant example validation test**

Run: `Get-Content samples/agent/adk/tests/test_examples_validation.py`
Expected: The example validation helper and current sample coverage are visible.

- [ ] **Step 2: Write the failing example validation update**

Modify `samples/agent/adk/tests/test_examples_validation.py` to add the new sample path:

```python
SAMPLE_DIRS = [
    "samples/agent/adk/contact_lookup/examples",
    "samples/agent/adk/restaurant_finder/examples",
    "samples/agent/adk/train_ticket_booking/examples",
]
```

- [ ] **Step 3: Run the validation test to verify it fails because the new example files do not exist**

Run: `uv run pytest samples/agent/adk/tests/test_examples_validation.py -q`
Expected: FAIL mentioning missing `train_ticket_booking/examples` files.

- [ ] **Step 4: Create the search form example**

Create `samples/agent/adk/train_ticket_booking/examples/0.9/search_form.json` with a `train-booking-wizard` surface containing:

```json
[
  {
    "version": "v0.9",
    "createSurface": {
      "surfaceId": "train-booking-wizard",
      "catalogId": "https://a2ui.org/specification/v0_9/basic_catalog.json",
      "theme": {
        "primaryColor": "#0052CC",
        "font": "Roboto"
      }
    }
  },
  {
    "version": "v0.9",
    "updateComponents": {
      "surfaceId": "train-booking-wizard",
      "components": [
        { "id": "root", "component": "Column", "children": ["title", "summary", "from-field", "to-field", "date-field", "time-field", "type-field", "search-button"] },
        { "id": "title", "component": "Text", "variant": "h2", "text": { "path": "/title" } },
        { "id": "summary", "component": "Text", "text": { "path": "/summary" } },
        { "id": "from-field", "component": "TextField", "label": "From", "value": { "path": "/fromStation" } },
        { "id": "to-field", "component": "TextField", "label": "To", "value": { "path": "/toStation" } },
        { "id": "date-field", "component": "TextField", "label": "Departure Date", "value": { "path": "/departureDate" } },
        { "id": "time-field", "component": "TextField", "label": "Time Preference", "value": { "path": "/timePreference" } },
        { "id": "type-field", "component": "TextField", "label": "Train Type", "value": { "path": "/trainType" } },
        { "id": "search-button", "component": "Button", "child": "search-button-text", "action": { "event": { "name": "search_trains", "context": { "fromStation": { "path": "/fromStation" }, "toStation": { "path": "/toStation" }, "departureDate": { "path": "/departureDate" }, "timePreference": { "path": "/timePreference" }, "trainType": { "path": "/trainType" } } } } },
        { "id": "search-button-text", "component": "Text", "text": "Search Trains" }
      ]
    }
  },
  {
    "version": "v0.9",
    "updateDataModel": {
      "surfaceId": "train-booking-wizard",
      "path": "/",
      "value": {
        "title": "Book a train ticket",
        "summary": "Review the auto-filled route and search for available trains.",
        "fromStation": "Shanghai",
        "toStation": "Beijing",
        "departureDate": "2026-03-30",
        "timePreference": "morning",
        "trainType": "high-speed"
      }
    }
  }
]
```

- [ ] **Step 5: Create the train results example**

Create `samples/agent/adk/train_ticket_booking/examples/0.9/train_results.json` with one `Column` showing a search summary plus two train result cards. Each result card should have seat-selection buttons that fire `select_train_seat` with `trainId`, `seatType`, `trainNumber`, `departureTime`, `arrivalTime`, and `finalPrice` in the context.

- [ ] **Step 6: Create the passenger form example**

Create `samples/agent/adk/train_ticket_booking/examples/0.9/passenger_form.json` with:

```json
[
  {
    "version": "v0.9",
    "updateComponents": {
      "surfaceId": "train-booking-wizard",
      "components": [
        { "id": "root", "component": "Column", "children": ["title", "trip-summary", "name-field", "id-field", "phone-field", "review-button"] },
        { "id": "title", "component": "Text", "variant": "h2", "text": { "path": "/title" } },
        { "id": "trip-summary", "component": "Text", "text": { "path": "/tripSummary" } },
        { "id": "name-field", "component": "TextField", "label": "Passenger Name", "value": { "path": "/passengerName" } },
        { "id": "id-field", "component": "TextField", "label": "ID Number", "value": { "path": "/passengerId" } },
        { "id": "phone-field", "component": "TextField", "label": "Phone Number", "value": { "path": "/phoneNumber" } },
        { "id": "review-button", "component": "Button", "child": "review-button-text", "action": { "event": { "name": "continue_to_review", "context": { "trainId": { "path": "/trainId" }, "trainNumber": { "path": "/trainNumber" }, "seatType": { "path": "/seatType" }, "departureTime": { "path": "/departureTime" }, "arrivalTime": { "path": "/arrivalTime" }, "finalPrice": { "path": "/finalPrice" }, "passengerName": { "path": "/passengerName" }, "passengerId": { "path": "/passengerId" }, "phoneNumber": { "path": "/phoneNumber" } } } } },
        { "id": "review-button-text", "component": "Text", "text": "Review Booking" }
      ]
    }
  }
]
```

- [ ] **Step 7: Create the booking review example**

Create `samples/agent/adk/train_ticket_booking/examples/0.9/booking_review.json` with a read-only summary card and a `confirm_booking` button whose event context includes the full selected trip and passenger data.

- [ ] **Step 8: Create the booking result example**

Create `samples/agent/adk/train_ticket_booking/examples/0.9/booking_result.json` with a confirmation card that binds `bookingReference`, `passengerName`, `trainNumber`, `seatType`, and `finalPrice`.

- [ ] **Step 9: Run example validation to verify the new examples pass**

Run: `uv run pytest samples/agent/adk/tests/test_examples_validation.py -q`
Expected: PASS

- [ ] **Step 10: Commit the example templates**

```bash
git add samples/agent/adk/train_ticket_booking/examples/0.9/search_form.json samples/agent/adk/train_ticket_booking/examples/0.9/train_results.json samples/agent/adk/train_ticket_booking/examples/0.9/passenger_form.json samples/agent/adk/train_ticket_booking/examples/0.9/booking_review.json samples/agent/adk/train_ticket_booking/examples/0.9/booking_result.json samples/agent/adk/tests/test_examples_validation.py
git commit -m "feat: add train ticket booking A2UI examples"
```

## Task 4: Implement Prompting Rules And The Agent Runner

**Files:**
- Create: `samples/agent/adk/train_ticket_booking/prompt_builder.py`
- Create: `samples/agent/adk/train_ticket_booking/agent.py`

- [ ] **Step 1: Write a failing import smoke test**

Create `samples/agent/adk/train_ticket_booking/test_agent_local.py` with:

```python
from agent import TrainTicketBookingAgent


def test_agent_card_exists():
  agent = TrainTicketBookingAgent(base_url="http://localhost:10012")
  assert agent.agent_card.name == "Train Ticket Booking Agent"
```

- [ ] **Step 2: Run the local agent smoke test to verify it fails**

Run: `cd samples/agent/adk/train_ticket_booking; uv run pytest test_agent_local.py -q`
Expected: FAIL because `agent.py` does not exist yet.

- [ ] **Step 3: Implement the prompt builder**

Create `samples/agent/adk/train_ticket_booking/prompt_builder.py` with:

```python
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
  return """
  You are a helpful train ticket booking assistant. Your final output MUST be text.

  Rules:
  1. For a search request, summarize what route information you understood.
  2. For a train selection, ask for passenger details.
  3. For a confirmed booking, return a short success confirmation.
  """
```

- [ ] **Step 4: Implement the agent by adapting the restaurant sample**

Create `samples/agent/adk/train_ticket_booking/agent.py` by copying the restaurant sample structure and changing:

```python
LITELLM_MODEL = os.getenv("OPENAI_MODEL", "openai/gpt-4.1-mini")
litellm_kwargs = {}
if os.getenv("OPENAI_BASE_URL"):
  litellm_kwargs["api_base"] = os.getenv("OPENAI_BASE_URL")
if os.getenv("OPENAI_API_KEY"):
  litellm_kwargs["api_key"] = os.getenv("OPENAI_API_KEY")
```

Use:

```python
model=LiteLlm(model=LITELLM_MODEL, **litellm_kwargs)
```

And register tools:

```python
tools=[search_trains, book_train_ticket]
```

Set:

```python
self._agent_name = "Train Ticket Booking Agent"
skill = AgentSkill(
    id="book_train_ticket",
    name="Train Ticket Booking Tool",
    description="Helps search trains and complete a mock train ticket booking flow.",
    tags=["train", "ticket", "booking"],
    examples=["Book me a high-speed train from Shanghai to Beijing tomorrow morning"],
)
```

- [ ] **Step 5: Run the local agent smoke test to verify it passes**

Run: `cd samples/agent/adk/train_ticket_booking; uv run pytest test_agent_local.py -q`
Expected: `1 passed`

- [ ] **Step 6: Delete the temporary local smoke test**

Run: `Remove-Item samples/agent/adk/train_ticket_booking/test_agent_local.py`
Expected: Temporary file removed.

- [ ] **Step 7: Commit the agent and prompt builder**

```bash
git add samples/agent/adk/train_ticket_booking/prompt_builder.py samples/agent/adk/train_ticket_booking/agent.py
git commit -m "feat: add train ticket booking agent"
```

## Task 5: Implement UI Event Routing In The Agent Executor

**Files:**
- Create: `samples/agent/adk/train_ticket_booking/agent_executor.py`

- [ ] **Step 1: Write a failing local executor routing test**

Create `samples/agent/adk/train_ticket_booking/test_executor_local.py` with:

```python
from agent_executor import _build_query_from_ui_event


def test_search_event_maps_to_search_query():
  query = _build_query_from_ui_event(
      "search_trains",
      {
          "fromStation": "Shanghai",
          "toStation": "Beijing",
          "departureDate": "2026-03-30",
          "timePreference": "morning",
          "trainType": "high-speed",
      },
  )
  assert "SEARCH_TRAINS" in query


def test_confirm_event_maps_to_booking_query():
  query = _build_query_from_ui_event(
      "confirm_booking",
      {
          "trainId": "G101",
          "seatType": "Second Class",
          "passengerName": "Kevin Zhang",
      },
  )
  assert "CONFIRM_BOOKING" in query
```

- [ ] **Step 2: Run the local executor test to verify it fails**

Run: `cd samples/agent/adk/train_ticket_booking; uv run pytest test_executor_local.py -q`
Expected: FAIL because `agent_executor.py` or helper function does not exist yet.

- [ ] **Step 3: Implement the executor with explicit action routing**

Create `samples/agent/adk/train_ticket_booking/agent_executor.py` with a helper:

```python
def _build_query_from_ui_event(action: str, ctx: dict) -> str:
  if action == "search_trains":
    return (
        "SEARCH_TRAINS: "
        f"from={ctx.get('fromStation')} "
        f"to={ctx.get('toStation')} "
        f"date={ctx.get('departureDate')} "
        f"time={ctx.get('timePreference')} "
        f"type={ctx.get('trainType')}"
    )
  if action == "select_train_seat":
    return (
        "SELECT_TRAIN_SEAT: "
        f"trainId={ctx.get('trainId')} "
        f"trainNumber={ctx.get('trainNumber')} "
        f"seatType={ctx.get('seatType')} "
        f"departureTime={ctx.get('departureTime')} "
        f"arrivalTime={ctx.get('arrivalTime')} "
        f"finalPrice={ctx.get('finalPrice')}"
    )
  if action == "continue_to_review":
    return (
        "CONTINUE_TO_REVIEW: "
        f"trainId={ctx.get('trainId')} "
        f"trainNumber={ctx.get('trainNumber')} "
        f"seatType={ctx.get('seatType')} "
        f"passengerName={ctx.get('passengerName')} "
        f"passengerId={ctx.get('passengerId')} "
        f"phoneNumber={ctx.get('phoneNumber')} "
        f"finalPrice={ctx.get('finalPrice')}"
    )
  if action == "confirm_booking":
    return (
        "CONFIRM_BOOKING: "
        f"trainId={ctx.get('trainId')} "
        f"seatType={ctx.get('seatType')} "
        f"passengerName={ctx.get('passengerName')} "
        f"passengerId={ctx.get('passengerId')} "
        f"phoneNumber={ctx.get('phoneNumber')}"
    )
  return f"UNKNOWN_UI_EVENT: action={action} context={ctx}"
```

Follow the restaurant executor structure, but set the final task state to `completed` only after `confirm_booking`; all earlier A2UI responses should remain `input_required`.

- [ ] **Step 4: Run the local executor test to verify it passes**

Run: `cd samples/agent/adk/train_ticket_booking; uv run pytest test_executor_local.py -q`
Expected: `2 passed`

- [ ] **Step 5: Delete the temporary local executor test**

Run: `Remove-Item samples/agent/adk/train_ticket_booking/test_executor_local.py`
Expected: Temporary file removed.

- [ ] **Step 6: Commit the executor**

```bash
git add samples/agent/adk/train_ticket_booking/agent_executor.py
git commit -m "feat: add train ticket booking executor"
```

## Task 6: Integrate The Sample Into Repo-Level Validation And Manual Demo Checks

**Files:**
- Modify: `samples/agent/adk/tests/test_examples_validation.py`
- Modify: `samples/agent/adk/train_ticket_booking/README.md`

- [ ] **Step 1: Re-open the example validation test and ensure the new path is committed in the final version**

Run: `Get-Content samples/agent/adk/tests/test_examples_validation.py`
Expected: The train ticket booking example directory is included.

- [ ] **Step 2: Add a manual verification section to the README**

Append to `samples/agent/adk/train_ticket_booking/README.md`:

```md
## Manual Verification Checklist

1. Send: `Book me a high-speed train from Shanghai to Beijing tomorrow morning`
2. Confirm the generated search form appears on a single surface
3. Click `Search Trains`
4. Confirm train cards are rendered with seat selection buttons
5. Click one seat button
6. Confirm the passenger form replaces the results content on the same surface
7. Fill in passenger details and continue
8. Confirm the booking review state appears
9. Confirm the booking
10. Confirm the booking success screen appears with a booking reference
```

- [ ] **Step 3: Run the example validation test**

Run: `uv run pytest samples/agent/adk/tests/test_examples_validation.py -q`
Expected: PASS

- [ ] **Step 4: Run the sample entrypoint with a placeholder model configuration to verify startup wiring**

Run: `cd samples/agent/adk/train_ticket_booking; $env:OPENAI_API_KEY='test-key'; $env:OPENAI_MODEL='openai/gpt-4.1-mini'; uv run python -m train_ticket_booking --help`
Expected: The command prints CLI help and exits successfully.

- [ ] **Step 5: Run a real manual demo once the user provides endpoint and key**

Run: `cd samples/agent/adk/train_ticket_booking; uv run .`
Expected: The sample starts locally and can be exercised through the supported client flow.

- [ ] **Step 6: Commit the final integration updates**

```bash
git add samples/agent/adk/tests/test_examples_validation.py samples/agent/adk/train_ticket_booking/README.md
git commit -m "test: integrate train ticket booking sample validation"
```

## Self-Review

### Spec coverage

- New sample directory: covered in Tasks 1 through 5.
- Single-surface happy path flow: covered in Tasks 3, 4, and 5.
- OpenAI-compatible configuration: covered in Tasks 1 and 4.
- Deterministic mock data and tools: covered in Task 2.
- Manual demo expectations: covered in Task 6.

### Placeholder scan

- No placeholder markers remain.
- Every task lists concrete files, commands, and expected outcomes.
- Code-bearing tasks include concrete code or concrete content requirements.

### Type consistency

- Environment variables consistently use `OPENAI_API_KEY`, `OPENAI_MODEL`, and optional `OPENAI_BASE_URL`.
- Surface ID is consistently `train-booking-wizard`.
- Action names are consistently `search_trains`, `select_train_seat`, `continue_to_review`, and `confirm_booking`.
- Tool names are consistently `search_trains` and `book_train_ticket`.
