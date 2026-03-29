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

import json
import logging
import os
import uuid

from google.adk.tools.tool_context import ToolContext

logger = logging.getLogger(__name__)


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
  """Search for available trains based on the given criteria.

  Args:
    from_station: The departure station name.
    to_station: The arrival station name.
    departure_date: The date of departure in YYYY-MM-DD format.
    time_preference: Time preference (e.g., "morning", "afternoon", "evening").
    train_type: Type of train (e.g., "high-speed", "bullet", "all").
    tool_context: The ADK tool context.

  Returns:
    A JSON string containing matching train options.
  """
  del tool_context
  logger.info(f"--- TOOL CALLED: search_trains ---")
  logger.info(f"  - From: {from_station}")
  logger.info(f"  - To: {to_station}")
  logger.info(f"  - Date: {departure_date}")
  logger.info(f"  - Time: {time_preference}")
  logger.info(f"  - Type: {train_type}")

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

  logger.info(f"  - Found {len(matches)} matching trains")
  return json.dumps(matches)


def book_train_ticket(
    train_id: str,
    seat_type: str,
    passenger_name: str,
    passenger_id: str,
    phone_number: str,
    tool_context: ToolContext,
) -> str:
  """Book a train ticket for the selected train and passenger.

  Args:
    train_id: The ID of the selected train.
    seat_type: The type of seat (e.g., "Second Class", "First Class").
    passenger_name: The passenger's full name.
    passenger_id: The passenger's ID number.
    phone_number: The passenger's phone number.
    tool_context: The ADK tool context.

  Returns:
    A JSON string containing the booking result.
  """
  del tool_context
  logger.info(f"--- TOOL CALLED: book_train_ticket ---")
  logger.info(f"  - Train ID: {train_id}")
  logger.info(f"  - Seat Type: {seat_type}")
  logger.info(f"  - Passenger: {passenger_name}")

  trains = _load_trains()
  selected_train = next(train for train in trains if train["trainId"] == train_id)
  selected_seat = next(
      seat for seat in selected_train["seatOptions"] if seat["seatType"] == seat_type
  )

  result = {
      "status": "success",
      "bookingReference": f"TTB-{uuid.uuid4().hex[:8].upper()}",
      "passengerName": passenger_name,
      "passengerId": passenger_id,
      "phone": phone_number,
      "selectedTrain": selected_train,
      "selectedSeatType": seat_type,
      "finalPrice": selected_seat["price"],
  }

  logger.info(f"  - Booking Reference: {result['bookingReference']}")
  return json.dumps(result)
