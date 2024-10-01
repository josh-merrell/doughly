# Doughly - Recipe Management Application

[Architecture Diagram](https://drive.google.com/file/d/10KTAOBiAnRqcTHLFYKmyeECASQscFeRv/view?usp=sharing)

Doughly is an Angular-based recipe management application, designed to offer a seamless user experience for storing, editing, and sharing cooking recipes. The application is published on the Apple App Store and Android Play Store, being deployed to mobile using the Ionic Capacitor framework. This repository is organized into two major sections: the **frontend** (built using Angular, Tailwind CSS) and the **backend** (server side, built using Node.js and Express). Additionally, the project includes cloud-based services and infrastructure for scalable deployment and data management.

## Table of Contents

- [Frontend](#frontend)
  - [Overview](#overview)
  - [Technology Stack](#technology-stack)
  - [Project Structure](#project-structure)
  - [Deployment](#deployment)
- [Backend ("Server")](#backend-server)
  - [Overview](#overview-1)
  - [Technology Stack](#technology-stack-1)
  - [Project Structure](#project-structure-1)
  - [API Endpoints](#api-endpoints)
  - [Infrastructure Setup](#infrastructure-setup)
  - [Error Handling](#error-handling)
  - [Deployment](#deployment-1)
- [Security and Authentication](#security-and-authentication)

---

## Frontend

### Overview

The Doughly frontend is a web application developed using Angular. It allows users to, among other things:

- Create, edit, and manage recipe collections.
- Manage friends/followers, and make recipes private or public.
- Manage Profile and Settings, including Profile Image.
- Import Recipes using AI image input or URL (scraping)
- Prepare recipe based shopping lists and share with friends for distributed fulfillment
- Maintain kitchen inventory of ingredients and tools
- Purchase subscriptions or in-app-purchases via App Store or Play Store APIs
- Use a unified light/dark theme based on preferences.

The frontend application also integrates with the backend to support real-time data fetching and user authentication via third-party providers.

### Technology Stack

- **Angular**: JavaScript framework for building the user interface.
- **NgRX**: Dynamic state management using Flux architecture
- **Tailwind CSS**: For responsive and custom styling.
- **Capacitor**: Used to deploy the application as mobile apps for Android and iOS.
- **CloudFront + S3**: To host and serve static assets.

### Project Structure

```bash
frontend/
│
├── src/
│   ├── app/
│   │   ├── components/              # Custom Angular components by feature
│   │   │   ├── data/
│   │   │   │   └── service.ts       # Component service methods (Used to call backend)
│   │   │   ├── state/
│   │   │   │   ├── actions.ts       # NgRX State mgmt: state change triggers
│   │   │   │   ├── reducers.ts      # NgRX State mgmt: state update logic
│   │   │   │   ├── effects.ts       # NgRX State mgmt: state side effects
│   │   │   │   ├── selectors.ts     # NgRX State mgmt: used to retrieve specific state
│   │   │   │   └── state.ts         # NgRX State mgmt: defines initial state modules and structure
│   │   │   └── ui/
│   │   │   │   ├── component.html   # Angular component rendering
│   │   │   │   └── component.ts     # Angular component logic
│   ├── assets/                      # Images, Animations, fonts, and other assets
│   ├── styles.scss                  # Global styles
│   └── index.html
│
├── angular.json                     # Angular configuration file
├── tailwind.config.js               # Tailwind CSS configuration
└── package.json                     # Dependencies and scripts
```

### Deployment

The frontend is deployed to an S3 bucket (`doughly.co`) and served via AWS CloudFront for optimized caching and performance.

Deployment is automated using GitHub Actions:

- **Build Workflow**: The `deploy-frontend-to-s3` action compiles the Angular code and uploads the build files to the S3 bucket.
- **S3 Integration**: The deployment process involves moving compressed images (`dl-image-compressed`) and other static assets to S3.

## Backend ("Server")

### Overview

The backend of Doughly is built with Node.js and Express, offering a REST API to manage data, including recipes, user profiles, and interactions. The backend also handles user authentication, image processing, and data caching.

### Technology Stack

- **Node.js**: Server-side runtime for running JavaScript code.
- **Express**: Web framework for building REST APIs.
- **PM2**: Process manager for running and managing backend processes.
- **Supabase**: Backend-as-a-Service (BaaS) for authentication and database management.
- **AWS (EC2, S3, SES)**: Used for hosting, data storage, and email communication.
- **Playwright & Cheerio**: For web scraping services.

### Project Structure
```bash
backend/
│
├── src/
│   ├── modules/           # API endpoint routers, handlers, and processors
│   ├── middleware/        # Middleware functions for request handling
│   ├── schemas/           # Data models used for request validation
│   ├── services/          # Services like image processing, scraping, AI, etc.
│   ├── scripts/           # Utility functions
│   └── server.js          # Main entry point
│
├── ecosystem.config.js    # PM2 configuration for application processes
└── package.json           # Dependencies and scripts
```

### Infrastructure Setup

### AWS EC2 Instances

The backend is hosted on multiple EC2 instances managed as an autoscaling group. Each instance runs the application using PM2 (Doughly application on port `3000`).

### Load Balancer

`dl-api-lb`: Distributes incoming requests across the EC2 instances to ensure availability and scalability.

### Database

Supabase is used to store data related to user profiles, recipes, shopping lists, and logs.

### Caching

Elasticache (Redis) is used for data ID sequence caching (`dl-prod-id-sequence-cache`).

### Image Storage and Processing

- Uploaded images are stored in an S3 bucket (`dl-temp-images`).
- A Lambda function (`dl-compress-image`) is triggered to compress images before final storage.

### Unit Conversion Service

A DynamoDB table (`dl-prod-unit-conversion-store`) is used for storing unit conversions, accessed via a Lambda function (`makePostCallToBackend`).

### Email Service

Amazon SES is used to send transactional emails from doughly.co (e.g., for verification, password reset).

### Error Handling

The backend uses a global error-handling middleware:

- **AppError Class**: Manages operational errors across the application, ensuring they are handled properly without crashing the server.

### Logging

**Loki and Grafana**: Error logs are sent to a Loki instance (`dl-logs-loki`) and visualized via a Grafana dashboard to monitor server performance and diagnose issues.

### Deployment

The backend API servers are deployed using:

- **GitHub Actions**: For CI/CD workflows, the `deploy-api-ec2-prod` action is used to push changes to the autoscaling group of EC2 instances.
- **PM2**: Each EC2 instance runs PM2 to manage server processes, ensuring the application is automatically restarted if it crashes.

### Authentication Providers

Doughly supports third-party authentication with Apple, Google, Facebook, and email-based authentication, facilitated via Supabase.


### License

This project is proprietary. View LICENSE for more details.

### Contact

Please contact the author [Josh Merrell](mailto:joshmerrell.us@gmail.com) with any questions.
