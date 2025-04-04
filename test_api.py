import requests
import json
import unittest
from time import sleep
import logging

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(),
        logging.FileHandler('api_tests.log')
    ]
)

class TestClinicalHistoryAPI(unittest.TestCase):
    BASE_URL = "http://localhost:5000/api/process-clinical-history"
    HEADERS = {"Content-Type": "application/json"}
    
    def setUp(self):
        self.test_name = self._testMethodName
        logging.info(f"\n{'='*50}\nStarting test: {self.test_name}\n{'='*50}")

    def log_response(self, response):
        logging.info(f"Request URL: {response.url}")
        logging.info(f"Status Code: {response.status_code}")
        try:
            logging.info("Response Body:\n" + 
                json.dumps(response.json(), indent=2, ensure_ascii=False))
        except ValueError:
            logging.info(f"Response Text: {response.text}")

    def test_api_key_validation(self):
        """Test if API key is properly configured"""
        response = requests.post(
            self.BASE_URL,
            headers=self.HEADERS,
            json={"history": "Test"}
        )
        self.log_response(response)
        
        if response.status_code == 403:
            logging.error("403 Forbidden - Likely API key issue")
            self.fail("API key validation failed (403 Forbidden)")
        elif response.status_code == 500:
            logging.error("500 Error - Check server logs")
            self.fail("Server error occurred")
        else:
            self.assertNotEqual(response.status_code, 403, "API key should be valid")

    def test_successful_request(self):
        test_data = {
            "history": "Paciente masculino, 45 anos, com dor abdominal há 3 dias."
        }
        
        logging.info(f"Test Data:\n{json.dumps(test_data, indent=2, ensure_ascii=False)}")
        
        response = requests.post(
            self.BASE_URL,
            headers=self.HEADERS,
            json=test_data
        )
        
        self.log_response(response)
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn("formData", data)

if __name__ == "__main__":
    print("Starting API tests with enhanced debugging...")
    print("Detailed logs will be saved to 'api_tests.log'")
    unittest.main()