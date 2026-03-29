# Train Ticket Booking A2UI Demo Design

Date: 2026-03-29

## Goal

Build a new sample at `samples/agent/adk/train_ticket_booking/` that demonstrates A2UI as the primary interaction layer for an agent-driven workflow.

The demo should emphasize that:

- The user provides a high-level intent once.
- The agent generates the booking UI using A2UI.
- User actions on the generated UI are sent back to the agent.
- The agent decides the next UI state and returns updated A2UI payloads.

The purpose of the sample is to demonstrate agent-generated UI and UI-driven workflow progression, not real train ticket integration.

## Non-Goals

- No real train ticket provider API integration.
- No waitlist, failure, refund, reschedule, or multi-passenger flows in v1.
- No hardcoded frontend booking flow logic.
- No multi-agent orchestration in v1.
- No seat map or complex railway-specific widgets in v1.

## Core Product Story

The sample behaves like a railway booking assistant. The user starts with a natural-language request such as:

`Book me a high-speed train from Shanghai to Beijing tomorrow morning.`

After that, the primary interaction moves into A2UI surfaces:

1. The agent generates a pre-filled search form.
2. The user edits or confirms fields and clicks search.
3. The agent queries local mock train data and generates a results list.
4. The user selects a train and seat type.
5. The agent generates a passenger information form.
6. The user fills the form and continues.
7. The agent generates a booking review screen.
8. The user confirms the booking.
9. The agent returns a booking success screen.

Chat remains an entry point and optional explanation channel, but the workflow itself is UI-first.

## Demo Priorities

The sample should optimize for these priorities in order:

1. Show that the agent generates and updates UI.
2. Show that UI actions are routed back to the agent.
3. Show that the agent controls workflow state, not the frontend.
4. Keep the business logic simple and deterministic.

## Recommended Interaction Model

Use a single primary surface, for example `train-booking-wizard`.

The surface should be created once and then updated across the whole workflow using A2UI operations. This makes the agent's control over the UI explicit and easy to demonstrate.

Why a single surface:

- It clearly shows incremental UI evolution.
- It minimizes frontend assumptions.
- It keeps the demo easy to follow during a live walkthrough.

## Surface States

The single surface should move through these five states.

### 1. Intent-Filled Search

The agent extracts initial query values from the user's message and generates a search form with defaults already populated.

Fields:

- from station
- to station
- departure date
- time preference
- train type preference

Primary action:

- `search_trains`

This state is important because it shows the agent converting natural language into editable UI rather than responding with follow-up chat questions.

### 2. Train Results

When the user clicks search, the client sends the event back to the agent. The agent calls a mock search tool and updates the surface to show train options.

Each train card should show:

- train number
- departure and arrival time
- duration
- seat types
- price
- remaining ticket count

Primary action per result:

- select a seat type for a specific train

### 3. Passenger Form

After a train and seat type are selected, the agent updates the same surface into a passenger form.

The top of the screen should include a compact booking summary:

- route
- train number
- seat type
- departure time
- price

Fields:

- passenger name
- ID document number
- phone number

Primary action:

- continue to review

### 4. Booking Review

The agent renders a read-only summary of the booking before confirmation.

This state should display:

- trip summary
- passenger summary
- final price

Actions:

- confirm booking
- go back and edit

### 5. Booking Result

After confirmation, the agent calls a mock booking tool and updates the surface into a success state.

This state should display:

- booking success title
- booking reference or order number
- selected train information
- passenger name
- price

Optional action:

- start a new search

V1 should only support the success path to keep the sample focused.

## Component Strategy

The sample should reuse the simplest existing A2UI component patterns already proven in `restaurant_finder`.

Recommended components by state:

### Intent-Filled Search

- `Text` for headings and helper copy
- `Card` and `Column` for grouping
- `TextField` for route and preferences
- `DateTimeInput` or equivalent date-oriented input for departure
- `Button` for search submission

### Train Results

- `Column` containing repeated result cards
- `Card` per train option
- `Text` for timing, duration, and fare details
- `Button` for seat selection actions

### Passenger Form

- `Text` for section labels and summary
- `Column` for vertical layout
- `TextField` for passenger data
- `Button` for submission

### Booking Review

- `Card` as summary container
- `Column` and `Text` for structured read-only details
- `Divider` where needed for clarity
- `Button` for confirm and edit actions

### Booking Result

- `Card`
- `Column`
- `Text`
- optional `Divider`

The emphasis should stay on state transitions and event-driven updates rather than advanced component variety.

## Agent, Tool, and Client Responsibilities

### Agent Responsibilities

The agent owns workflow state and UI generation.

It should:

- interpret the user's initial booking request
- decide which surface state to render next
- call tools when data is needed
- produce A2UI payloads for each state
- interpret UI events and form submissions

### Tool Responsibilities

Tools should be domain-only and UI-agnostic.

Planned tools:

- `search_trains`
- `book_train_ticket`

`search_trains` returns mock train options based on input filters.

`book_train_ticket` returns a deterministic mock success result with booking details.

Tools must not decide layout, surface identity, or component structure.

### Client Responsibilities

The client should:

- render the returned A2UI payload
- capture button and form events
- send those events back to the agent

The client should not encode booking workflow transitions itself. That logic belongs to the agent.

## Data Model

Use a local JSON file such as `train_data.json` to store deterministic mock train data.

Suggested fields per train:

- `trainId`
- `trainNumber`
- `from`
- `to`
- `departureTime`
- `arrivalTime`
- `duration`
- `date`
- `trainType`
- `seatOptions`

Suggested fields per seat option:

- `seatType`
- `price`
- `remaining`

The booking tool may generate:

- `bookingReference`
- `passengerName`
- `phone`
- `selectedTrain`
- `selectedSeatType`
- `finalPrice`

## A2UI Update Pattern

Each workflow step should be implemented as a clear A2UI state transition.

Recommended pattern:

1. `createSurface` for the initial booking surface
2. `updateComponents` to define the structure for the current state
3. `updateDataModel` to bind state-specific values

Subsequent steps may reuse the same `surfaceId` and replace component trees as the workflow advances.

This is the key behavior the sample is meant to demonstrate.

## OpenAI-Compatible LLM Requirement

The new sample must use an OpenAI-compatible chat/completions interface instead of a Gemini-specific setup.

Requirements:

- model configuration should accept an OpenAI-style model name
- API base URL should be configurable
- API key should be configurable
- the sample should be ready to test later with user-provided endpoint and key

This means the implementation should avoid hard-coding Gemini-only assumptions into the new sample's LLM integration.

Environment should be designed around values such as:

- `OPENAI_API_KEY`
- `OPENAI_BASE_URL`
- `OPENAI_MODEL`

Exact naming can be finalized during implementation, but the integration target is an OpenAI-compatible API contract.

## Repo Mapping

The new sample should be created in parallel to the restaurant example, not by mutating it in place.

Target directory:

`samples/agent/adk/train_ticket_booking/`

The main implementation should mirror the structure of:

- `samples/agent/adk/restaurant_finder/agent.py`
- `samples/agent/adk/restaurant_finder/agent_executor.py`
- `samples/agent/adk/restaurant_finder/prompt_builder.py`
- `samples/agent/adk/restaurant_finder/tools.py`

The new example assets should include:

- `examples/0.9/search_form.json`
- `examples/0.9/train_results.json`
- `examples/0.9/passenger_form.json`
- `examples/0.9/booking_review.json`
- `examples/0.9/booking_result.json`

## Minimal V1 Scope

The first implementation should include only the happy path:

1. natural-language intent
2. pre-filled search form
3. train search
4. result selection
5. passenger form
6. review
7. success result

V1 explicitly excludes:

- booking failure handling
- validation error branches beyond basic required-field handling if unavoidable
- multiple passengers
- waitlist
- refunds or changes
- real external APIs

## Testing Expectations

The sample should be easy to test manually in the existing shell or supported client environment.

Manual verification should confirm:

- initial user message triggers a generated UI surface
- search button triggers agent-side search and results rendering
- train selection triggers a new generated form
- form submission triggers a generated review state
- confirmation triggers a generated success state

The final implementation should also be testable later with a user-provided OpenAI-compatible endpoint and key.

## Risks and Mitigations

### Risk: The sample feels like a normal app, not an agent-generated UI demo

Mitigation:

- keep chat minimal after the first message
- make each state transition clearly agent-driven
- keep the client thin

### Risk: Too much railway-specific detail obscures the protocol demo

Mitigation:

- keep fields minimal
- avoid special widgets
- keep the happy path short

### Risk: LLM integration becomes the focus instead of A2UI

Mitigation:

- isolate LLM configuration behind simple environment variables
- keep business tools deterministic
- keep surface transitions explicit and inspectable

## Implementation Recommendation

Implement the new sample as a focused adaptation of `restaurant_finder` with a train-booking domain model and OpenAI-compatible LLM wiring.

Do not begin with extra branches or richer UI. The first version should prove one thing clearly:

The agent can generate the booking UI, receive UI events, and generate the next UI state using A2UI as the main interaction protocol.
