import os
import json
import itertools
import time
import google.generativeai as genai
from google.api_core.exceptions import ResourceExhausted

class GeminiClient:
    def __init__(self):
        # Extract all keys starting with GEMINI_API_KEY from os.environ
        keys = [v for k, v in os.environ.items() if k.startswith("GEMINI_API_KEY") and v.strip()]
        if not keys:
            raise ValueError("No GEMINI_API_KEY found in environment.")
        
        self.keys = keys
        self.key_cycle = itertools.cycle(self.keys)
        self.current_key = next(self.key_cycle)
        genai.configure(api_key=self.current_key)
        print(f"[Gemini] Configured with {len(self.keys)} API Key(s).")
    
    def _rotate_key(self):
        self.current_key = next(self.key_cycle)
        genai.configure(api_key=self.current_key)
        print(f"[Gemini] Rotated to next API Key.")

    def analyze_property_text(self, text_context: str) -> dict:
        prompt = """
        You are a Japanese Real Estate expert analyzing public auction documents (BIT / NTA).
        Based on the provided text context extracted from the auction PDFs, generate a strictly structured JSON output that contains exactly 3 language translations (ja, en, vi) of the analysis.
        
        The structural schema is:
        {
          "source": "BIT" or "NTA",
          "property_type": "Mansion" or "House",
          "analysis": {
            "ja": {
              "risk_tags": ["list", "of", "risks"],
              "financial_details": { "arrears": 100000, "additional_costs": "description" },
              "occupancy": "status"
            },
            "en": {
               ... corresponding English translation ...
            },
            "vi": {
               ... corresponding Vietnamese translation ...
            }
          }
        }
        
        Guidelines:
        1. "risk_tags": Include tags if there are unpaid management fees (滞納), psychological defects/deaths (心理的瑕疵), boundary issues (境界未定), or natural disaster zones. Keep it strictly to the severe points.
        2. "financial_details": Extract actual numeric unpaid fees if known, otherwise 0. For `additional_costs`, extract if the buyer has to pay for demolition, evacuation, etc. (費用負担).
        3. "occupancy": Who is currently living there (Tenant, Owner, Empty, Unknown).
        
        ONLY Output the raw JSON string without markdown formatting like ```json ... ```. 
        """

        generation_config = genai.types.GenerationConfig(
            temperature=0.0,
            response_mime_type="application/json"
        )
        
        model = genai.GenerativeModel('gemini-2.0-flash', generation_config=generation_config)

        # Try every key in the rotation once before giving up
        num_keys = len(self.keys)
        for attempt in range(num_keys):
            try:
                full_prompt = f"{prompt}\n\n--- DOCUMENT TEXT CONTEXT ---\n{text_context}"
                response = model.generate_content(full_prompt)
                
                # Parse JSON
                result_json = json.loads(response.text)
                return result_json
                
            except ResourceExhausted:
                print(f"[Gemini] Key {attempt + 1}/{num_keys} hit 429. Rotating...")
                self._rotate_key()
                model = genai.GenerativeModel('gemini-2.0-flash', generation_config=generation_config)
                # Brief wait before using the next key
                time.sleep(1)
                continue
                
            except Exception as e:
                print(f"[Gemini] Unexpected Error: {e}")
                return {"error": "UNEXPECTED_ERROR", "message": str(e)}

        # If we loop through ALL keys and all return 429
        print("[Gemini] CRITICAL: All API keys have exceeded their rate limits.")
        return {"error": "ALL_KEYS_EXHAUSTED"}
