import os
from dotenv import load_dotenv

def test_api_key():
    load_dotenv()
    api_key = os.getenv('GOOGLE_AI_API_KEY')
    
    print("\n=== API Key Test ===")
    print(f"Key exists: {'YES' if api_key else 'NO'}")
    print(f"Key length: {len(api_key) if api_key else 0}")
    print(f"First 5 chars: {api_key[:5] if api_key else 'N/A'}")
    print(f"Last 5 chars: {api_key[-5:] if api_key else 'N/A'}")
    print("==================\n")

if __name__ == "__main__":
    test_api_key()