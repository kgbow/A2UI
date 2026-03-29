from collections.abc import AsyncIterator

from a2ui.runtime.adapters.base import RuntimeAdapter
from a2ui.runtime.types import NormalizedEvent, RuntimeRequest, RuntimeResult


class AgentRunner:
  def __init__(self, adapters: dict[str, RuntimeAdapter], default_runtime: str = "google_adk"):
    self._adapters = adapters
    self._default_runtime = default_runtime

  def _select_runtime(self, request: RuntimeRequest) -> RuntimeAdapter:
    runtime_kind = request.metadata.get("runtime_kind", self._default_runtime)
    if runtime_kind not in self._adapters:
      raise ValueError(f"Unsupported runtime_kind: {runtime_kind}")
    return self._adapters[runtime_kind]

  async def run(self, request: RuntimeRequest) -> RuntimeResult:
    adapter = self._select_runtime(request)
    return await adapter.run(request)

  async def stream(
      self, request: RuntimeRequest
  ) -> AsyncIterator[NormalizedEvent]:
    adapter = self._select_runtime(request)
    async for event in adapter.stream(request):
      yield event
