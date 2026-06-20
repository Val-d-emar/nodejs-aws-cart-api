# AWS Cart & Checkout Service (Docker + Elastic Beanstalk)

This repository contains the Cart & Checkout microservice built on top of the **NestJS** framework, integrated with **AWS RDS PostgreSQL**, containerized with **Docker**, and deployed to **AWS Elastic Beanstalk (PaaS)**.

---

## Architecture

### The Problem: Mixed Content Block

The Frontend application (React Shop) is hosted on AWS S3 and served securely via AWS CloudFront over **HTTPS**.
However, our Cart Service on AWS Elastic Beanstalk is deployed as a `--single` EC2 instance to stay within the **AWS Free Tier** and avoid the monthly costs of an AWS Application Load Balancer (ALB) and SSL certificates. This means Beanstalk serves the API over unencrypted **HTTP**.

Modern web browsers strictly block requests from secure origins (`https://`) to insecure origins (`http://`) due to **Mixed Content Security Policies**. This results in a silent failure (`Network Error` / `Blocked by Client`) in the browser console.

### The Solution: CloudFront as an HTTPS Proxy (100% Free & Secure)

Instead of provisioning a costly ALB, we deployed a **second AWS CloudFront distribution** specifically for the Cart Service using AWS CDK.

```text
[React Frontend] (HTTPS)
       │
       ▼ (Secure API Call)
[CloudFront API Proxy] (HTTPS) ──► [Elastic Beanstalk] (HTTP) ──► [RDS PostgreSQL] (VPC)
```

1. **CloudFront** acts as a secure entry point and provides a free SSL certificate (`https://*.cloudfront.net`).
2. It receives **HTTPS** requests from the Frontend, preserves essential headers (like `Authorization`), and forwards them to the **Elastic Beanstalk** EC2 container over **HTTP** internally.
3. This completely bypasses the Mixed Content policy, keeps our database private, and costs **$0.00**!

---

## Step-by-Step Deployment Sequence

Follow this exact sequence to deploy the infrastructure and code from scratch:

### Prerequisites:

- AWS CLI configured with administrator credentials.
- AWS EB CLI installed (`eb --version`).
- Docker installed locally.

### Step 1: Provision the PostgreSQL Database

Create a private, secure RDS instance in your Default VPC using the AWS CLI:

```bash
aws rds create-db-instance \
    --region eu-north-1 \
    --db-instance-identifier cart-postgres \
    --db-instance-class db.t3.micro \
    --engine postgres \
    --master-username cart_user \
    --master-user-password YOUR_SECURE_PASSWORD \
    --allocated-storage 20 \
    --db-name cart_db \
    --no-publicly-accessible
```

*Note: Wait until the status changes to `Available` in the AWS Console, then copy the **Endpoint Address**.*

### Step 2: Configure Local Environment Variables

1. Create a `.env` file in the `cdk/` folder:

   ```env
   DB_PASSWORD=YOUR_SECURE_PASSWORD
   DB_HOST=YOUR_RDS_ENDPOINT_ADDRESS (e.g. cart-postgres.xxxxxx.eu-north-1.rds.amazonaws.com)
   ```
2. Make sure `cdk/.env` is added to `.gitignore`.

### Step 3: Compile and Package the NestJS App

Build the NestJS application locally on your machine. This generates the compiled code inside the `dist/` folder and preserves all TypeScript decorator metadata:

```bash
npm run build
```

### Step 4: Deploy the Container to AWS Elastic Beanstalk

1. Initialize the Beanstalk app (choose **Docker** and **Amazon Linux 2023**):

   ```bash
   eb init
   ```
2. Deploy the application to a single-instance environment, passing the database credentials:

   ```bash
   eb create test --single \
     --cname "Val-d-emar-cart-api-prod" \
     --envvars DB_HOST=YOUR_RDS_ENDPOINT_ADDRESS,DB_PORT=5432,DB_USERNAME=cart_user,DB_PASSWORD=YOUR_SECURE_PASSWORD,DB_DATABASE=cart_db,NODE_ENV=production
   ```

   *Note: Due to our `.ebignore` configuration, EB will upload the pre-compiled `dist/` folder directly, avoiding heavy memory-consuming TypeScript compilation in the cloud (which prevents t3.micro server crashes).*

### Step 5: Configure Security Groups

Go to AWS RDS Console -> `cart-postgres` -> Inbound Rules. Add a rule:

- **Type:** PostgreSQL (5432)
- **Source:** Custom -> Select the Security Group created by Elastic Beanstalk (starts with `awseb-e-...`).

### Step 6: Deploy the CloudFront HTTPS Proxy

Navigate to the `cdk/` directory, add the variables `DB_*` + `EB_URL `to `cdk/.env` and deploy the CloudFront stack:

```bash
cd cdk
npm run build
npx cdk deploy
```

*Copy the `CloudFrontApiUrl` outputted at the end of the deployment.*

### Step 7: Update and Deploy Frontend

In your frontend repository, open `src/constants/apiPaths.ts` and update the `cart` and `order` URLs with the new `CloudFrontApiUrl` (with `/api` suffix), then deploy your frontend.

```bash
npm run deploy
```

---

## Installation nodejs-aws-cart-api local

```bash
npm install
```

## Running the app

```bash
# development
npm run start

# watch mode
npm run start:dev

# production mode
npm run start:prod
```

## Test

```bash
# unit tests
npm run test

# e2e tests
npm run test:e2e

# test coverage
npm run test:cov
```

### Create user and get auth token

register user with `POST` http://localhost:4000/api/auth/register

Body:

```json
{
  "name": "your_github_login",
  "password": "TEST_PASSWORD"
}
```

**get token** with `POST` http://localhost:4000/api/auth/login

Body

```json
{
  "username": "your_github_login",
  "password": "TEST_PASSWORD"
}
```

Response

```json
{
  "token_type": "Basic",
  "access_token": "eW91ckdpdGh1YkxvZ2luOlRFU1RfUEFTU1dPUkQ="
}

```

**Or you can do it with bash script, make sure you have installed `curl` in your system**

Put content of env.example to .env and **update credentials**:

```bash
cat env.example > .env
```

Create user and get token

```bash
./get-token.sh
```

if command failed make script executable

```bash
chmod +x ./get-token.sh
```
