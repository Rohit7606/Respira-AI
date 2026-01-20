import json
import time
import logging

# Configure basic logger
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("respira-telemetry")

class TelemetryService:
    def log_trust_event(self, event_type: str, data: dict):
        """
        Emits a structured JSON log for observability platforms (e.g. Datadog, Sentry).
        """
        payload = {
            "timestamp": time.time(),
            "event": "TRUST_EVENT",
            "type": event_type,
            "payload": data
        }
        # writing to stdout as JSON
        logger.warning(json.dumps(payload))

telemetry_service = TelemetryService()
