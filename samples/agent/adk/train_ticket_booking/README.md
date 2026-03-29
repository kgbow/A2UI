# A2UI Train Ticket Booking Sample

This sample demonstrates a train ticket booking workflow where the agent generates
and updates A2UI surfaces based on user actions.

## Prerequisites

- Python 3.13+
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
