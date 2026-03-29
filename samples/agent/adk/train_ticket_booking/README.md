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
- optional `OPENAI_REASONING_EFFORT`
- optional `OPENAI_THINKING_TYPE`
- optional `OPENAI_THINKING_CLEAR_THINKING`
- optional `TRAIN_TICKET_MODE`

Example for GLM models when you want to suppress thinking blocks:

```env
OPENAI_MODEL=openai/glm-4.7
OPENAI_BASE_URL=https://your-openai-compatible-host/v1
OPENAI_THINKING_TYPE=disabled
OPENAI_THINKING_CLEAR_THINKING=true
```

To run a fully static mock flow that replays recorded A2UI messages from
`gen_results/1.json` to `gen_results/5.json`, set:

```env
TRAIN_TICKET_MODE=mock
```

In mock mode, OpenAI-compatible API configuration is not required.

## Run

```bash
uv run .
```

## Run With React Shell

Start the agent:

```bash
cd samples/agent/adk/train_ticket_booking
uv run .
```

In another terminal, start the React shell:

```bash
cd samples/client/react/shell
npm install
npm run dev
```

Open:

`http://localhost:5173/?app=train-ticket`

## Demo Flow

1. Send a natural-language booking request.
2. Confirm the generated search form.
3. Search trains.
4. Select a train and seat type.
5. Fill in passenger details.
6. Review and confirm the booking.
7. Receive a generated success surface.

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
