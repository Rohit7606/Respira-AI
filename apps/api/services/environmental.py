import os
import httpx
import asyncio
import random
from typing import Optional
from pydantic import BaseModel

class EnvironmentalData(BaseModel):
    aqi: int
    pm25: float
    temperature: float
    humidity: int
    source: str  # 'api' or 'fallback' (or 'cached' in future)

class EnvironmentalService:
    def __init__(self):
        self.api_key = os.environ.get("e7e5c7a376e1cfa3fa1c3524a90cb080")
        self.base_url = "http://api.openweathermap.org"

    async def get_data(self, zip_code: str, country_code: str = "US") -> EnvironmentalData:
        # Load key from env (Rule 2 setup)
        if not self.api_key:
             self.api_key = os.environ.get("OPENWEATHERMAP_API_KEY")

        if not self.api_key:
            print("Warning: OPENWEATHERMAP_API_KEY not found. Using fallback data.")
            return self._get_fallback_data(zip_code)

        try:
            async with httpx.AsyncClient() as client:
                # 1. Geocoding API: Zip -> Lat/Lon
                geo_url = f"{self.base_url}/geo/1.0/zip?zip={zip_code},{country_code}&appid={self.api_key}"
                geo_resp = await client.get(geo_url)
                geo_resp.raise_for_status()
                geo_data = geo_resp.json()
                
                lat = geo_data['lat']
                lon = geo_data['lon']

                # 2. Parallel Fetch: Current Weather + Air Pollution
                weather_url = f"{self.base_url}/data/2.5/weather?lat={lat}&lon={lon}&units=metric&appid={self.api_key}"
                pollution_url = f"{self.base_url}/data/2.5/air_pollution?lat={lat}&lon={lon}&appid={self.api_key}"

                weather_resp, pollution_resp = await asyncio.gather(
                    client.get(weather_url),
                    client.get(pollution_url)
                )

                weather_resp.raise_for_status()
                pollution_resp.raise_for_status()

                w_data = weather_resp.json()
                p_data = pollution_resp.json()

                # Parse Data
                return EnvironmentalData(
                    aqi=p_data['list'][0]['main']['aqi'], # 1-5 scale usually from OWM
                    pm25=p_data['list'][0]['components']['pm2_5'],
                    temperature=w_data['main']['temp'],
                    humidity=w_data['main']['humidity'],
                    source="api"
                )

        except Exception as e:
            print(f"Error fetching OWM data: {e}. Using fallback.")
            return self._get_fallback_data(zip_code)

    def _get_fallback_data(self, zip_code: str) -> EnvironmentalData:
        # Graceful Degradation: Deterministic mock data based on zip
        try:
            seed = int(zip_code)
            random.seed(seed)
        except:
            random.seed(42)
            
        return EnvironmentalData(
            aqi=random.randint(1, 5),  # OWM uses 1-5 scale (1=Good, 5=Very Poor)
            pm25=round(random.uniform(5.0, 55.0), 1),
            temperature=round(random.uniform(10.0, 35.0), 1),
            humidity=random.randint(30, 80),
            source="fallback"
        )

env_service = EnvironmentalService()
