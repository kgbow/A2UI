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
