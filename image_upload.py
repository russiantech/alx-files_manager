import base64
import requests
import sys

# Check if the correct number of arguments are provided
if len(sys.argv) != 4:
    print("Usage: python image_upload.py <image_path> <token> <parentId>")
    sys.exit(1)

file_path = sys.argv[1]
token = sys.argv[2]
parent_id = sys.argv[3]

# Get the file name from the file path
file_name = file_path.split('/')[-1]

# Read and encode the file
with open(file_path, "rb") as image_file:
    file_encoded = base64.b64encode(image_file.read()).decode('utf-8')

# Prepare the request payload and headers
r_json = {
    'name': file_name,
    'type': 'image',
    'isPublic': True,
    'data': file_encoded,
    'parentId': parent_id
}
r_headers = {
    'X-Token': token
}

# Send the request
r = requests.post("http://0.0.0.0:5000/files", json=r_json, headers=r_headers)

# Print response status code and content
print("Status Code:", r.status_code)
print("Response Content:", r.content)

# Attempt to print JSON response if possible
try:
    print("Response JSON:", r.json())
except requests.exceptions.JSONDecodeError:
    print("Failed to decode JSON response")

