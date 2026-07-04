import os
from locust import HttpUser, task, between

class PMindsUser(HttpUser):
    # Wait time between tasks (1 to 5 seconds)
    wait_time = between(1, 5)

    def on_start(self):
        # 1. Hit a safe GET endpoint (like your homepage or a simple check view) 
        # to force Django to send back a CSRF cookie
        self.client.get("/") 
        
        # 2. Extract the CSRF token from the browser cookies automatically managed by Locust
        csrftoken = self.client.cookies.get("csrftoken")
        
        # 3. Add the token to the headers for the upcoming POST request
        headers = {
            "X-CSRFToken": csrftoken
        }
        
        # 4. Attempt the login again with the CSRF header included
        response = self.client.post("/api/auth/login/", json={
            "email": "aaya@test.com",  
            "password": "testpass123"
        }, headers=headers)
        
        print(f"--- NEW LOGIN STATUS: {response.status_code} ---")
        print(f"--- NEW LOGIN RESPONSE: {response.text} ---")

    @task(3)
    def view_notes(self):
        """Simulate a user viewing the notes list."""
        # If authentication is required, add headers:
        # headers = {"Authorization": f"Bearer {self.token}"}
        # self.client.get("/api/notes/", headers=headers)
        
        # We use a try/except block to avoid Locust stopping on connection errors
        with self.client.get("/api/notes/", catch_response=True) as response:
            if response.status_code == 200:
                response.success()
            elif response.status_code in [401, 403]:
                # Ignore auth errors if we just want to test load on the endpoint
                response.success() 
            else:
                response.failure(f"Failed with status {response.status_code}")

    @task(1)
    def view_tags(self):
        """Simulate a user viewing tags."""
        with self.client.get("/api/tags/", catch_response=True) as response:
             if response.status_code in [200, 401, 403]:
                 response.success()

    @task(1)
    def view_folders(self):
        """Simulate a user viewing folders."""
        with self.client.get("/api/folders/", catch_response=True) as response:
             if response.status_code in [200, 401, 403]:
                 response.success()
