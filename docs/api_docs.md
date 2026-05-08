# API Documentation

## Base URL
```
http://localhost:8000/api
```

## Authentication

### POST /api/auth/login
Login and get access token.
```json
{ "username": "admin", "password": "admin123" }
```

### POST /api/auth/register
Register a new user.

## Chat

### GET /api/chat/conversations
Get all conversations.

### POST /api/chat/conversations
Create a new conversation.

### POST /api/chat/conversations/{id}/messages
Send a message and get AI response.

## Files

### GET /api/files
List all uploaded files.

### POST /api/files/upload
Upload a file (multipart/form-data).

### DELETE /api/files/{id}
Delete a file.

## Workflows

### GET /api/workflows
List all workflows.

### POST /api/workflows
Create a new workflow.

### POST /api/workflows/{id}/pause
Pause a running workflow.

### POST /api/workflows/{id}/resume
Resume a paused workflow.

## Memory

### GET /api/memory
Get all memory entries.

### POST /api/memory
Create a new memory entry.

### DELETE /api/memory/{id}
Delete a memory entry.

## Health

### GET /api/health
Health check endpoint.
