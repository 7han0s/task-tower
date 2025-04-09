# Task Tower Setup Guide

## 1. Prerequisites

### 1.1 Software Requirements
- Node.js (v18 or higher)
- npm (v8 or higher)
- Google Cloud Platform account
- Google Sheets API credentials

### 1.2 Hardware Requirements
- Modern computer
- Stable internet connection
- Sufficient storage
- Compatible web browser

## 2. Installation

### 2.1 Clone Repository
```bash
git clone [repository-url]
cd task-tower
```

### 2.2 Install Dependencies
```bash
cd server
npm install
cd ../client
npm install
```

### 2.3 Set Up Environment Variables

#### 2.3.1 Server Environment Variables
Create a `.env` file in the `server` directory:
```
GOOGLE_CREDENTIALS={your-google-credentials}
GOOGLE_SPREADSHEET_ID={your-spreadsheet-id}
```

#### 2.3.2 Client Environment Variables
Create a `.env` file in the `client` directory:
```
REACT_APP_API_URL=http://localhost:3000
REACT_APP_GOOGLE_SPREADSHEET_ID={your-spreadsheet-id}
```

## 3. Google Sheets Setup

### 3.1 Create Google Cloud Project
1. Go to Google Cloud Console
2. Create new project
3. Enable Google Sheets API
4. Create service account
5. Download credentials

### 3.2 Set Up Spreadsheet
1. Create new Google Sheet
2. Share with service account email
3. Set up proper permissions
4. Note spreadsheet ID

## 4. Running the Application

### 4.1 Development Mode
```bash
cd server
npm run dev

cd ../client
npm start
```

### 4.2 Production Mode
```bash
cd server
npm run build
npm start

cd ../client
npm run build
```

## 5. Testing

### 5.1 Run Tests
```bash
cd server
npm test

cd ../client
npm test
```

### 5.2 Test Coverage
- Unit tests
- Integration tests
- Performance tests
- Security tests

## 6. Deployment

### 6.1 Local Development
1. Start server
2. Start client
3. Test functionality
4. Fix issues

### 6.2 Production Deployment
1. Build artifacts
2. Push to repository
3. Automated deployment
4. Manual approval
5. Rollback capability

## 7. Troubleshooting

### 7.1 Common Issues
- Build failures
- Test failures
- Deployment issues
- Performance bottlenecks

### 7.2 Solutions
- Check dependencies
- Review code changes
- Check environment variables
- Monitor performance

## 8. Security

### 8.1 Code Security
- Input validation
- Sanitization
- Authentication
- Authorization

### 8.2 API Security
- Secure endpoints
- Input validation
- Rate limiting
- Error handling

### 8.3 Data Security
- Secure storage
- Encryption
- Access control
- Audit logging

## 9. Performance Optimization

### 9.1 Client-Side
- Code splitting
- Lazy loading
- Asset optimization
- Efficient state management

### 9.2 Server-Side
- Caching
- Batch processing
- Efficient error handling
- Resource management
