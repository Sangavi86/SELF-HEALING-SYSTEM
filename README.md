# Cognitive Self-Healing Software Ecosystem

This is a production-ready full-stack application that provides monitoring, incident management, AI-driven predictions, and self-healing capabilities.

## Architecture

The system follows a modular microservice architecture.

### Backend (`/backend`)
- **Gateway**: API Gateway to route requests to microservices.
- **Services**: Microservices for distinct domain logic:
  - `monitoring-agent`
  - `anomaly-agent`
  - `prediction-agent`
  - `rootcause-agent`
  - `healing-agent`
  - `learning-agent`
- **AI**: Specialized services for AI tasks:
  - `anomaly`
  - `prediction`
  - `rootcause`
  - `models`
- **Shared**: Shared libraries and database connections (`database/models`, `middleware`, `utils`).

### Frontend (`/frontend`)
- React + Vite application.
- TailwindCSS for styling.
- Recharts for visualizations.

## Getting Started

*(Instructions on how to start the ecosystem locally will be provided here once the application features are implemented.)*
