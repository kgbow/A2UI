from collections.abc import AsyncIterator
from typing import Protocol

from a2ui.runtime.types import NormalizedEvent, RuntimeRequest, RuntimeResult


class RuntimeAdapter(Protocol):
  async def run(self, request: RuntimeRequest) -> RuntimeResult:
    ...

  async def stream(self, request: RuntimeRequest) -> AsyncIterator[NormalizedEvent]:
    ...
