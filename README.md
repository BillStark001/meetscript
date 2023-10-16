# MeetScript

A tool set to transcript and translate meetings in real-time.

## Overall Structure

The application uses:
- FastAPI and Uvicorn for backend
- SQLite and Peewee for database
- OpenAI Whisper for transcription
  - And henceforth PyTorch for neural computation
- React and ChakraUI for frontend

In order to run the server, 
- Python (minimum v3.9) 
- Node.js (minimum v16)
needs to be installed. Use
- `cd ms-server; pip install -r requirements.txt`
- `cd ms-frontend; npm i`
to install all the requirements.

If you choose to use Whisper api and you have available GPU, 
installing CUDA and CUDA-version PyTorch will be a good option.

## Deployment

### Launching Directly

After the requirements are set, use 
- `./launch.sh` to launch the server with static files being mounted.
- `./launch-only.sh` to launch the server without static files.


### Using Reverse Proxy

If Nginx is installed, use `./deploy.sh` to configure the site and launch the server.

## Development

TODO


