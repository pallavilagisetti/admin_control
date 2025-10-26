# Backend Connection Troubleshooting Guide

## Issue: "Failed to generate remote. Try again later"

This error typically occurs when the frontend cannot connect to the backend server. Here's how to fix it:

## 🔍 Step 1: Check Backend Server Status

1. **Start the backend server:**
   ```bash
   cd upstar-backend
   npm install
   npm run dev
   ```

2. **Verify the backend is running:**
   - Check the console output for: `🚀 Server running on port 5000`
   - Visit: http://localhost:5000/api/health
   - You should see a JSON response with server status

## 🔧 Step 2: Configure Frontend Environment

1. **Create environment file:**
   ```bash
   cd upstar-website
   cp .env.example .env.local
   ```

2. **Update the API URL in `.env.local`:**
   ```env
   NEXT_PUBLIC_API_URL=http://localhost:5000
   ```

3. **If port 5000 doesn't work, try these alternatives:**
   ```env
   # Try port 3000
   NEXT_PUBLIC_API_URL=http://localhost:3000
   
   # Or port 3001
   NEXT_PUBLIC_API_URL=http://localhost:3001
   ```

## 🧪 Step 3: Test Connection

1. **Run the connection test:**
   ```bash
   cd upstar-website
   node test-backend-connection.js
   ```

2. **Check browser console:**
   - Open browser developer tools (F12)
   - Look for API request logs starting with 🌐
   - Check for error messages

## 🚨 Common Issues & Solutions

### Issue 1: Backend not running
**Solution:** Start the backend server
```bash
cd upstar-backend
npm run dev
```

### Issue 2: Wrong port configuration
**Solution:** Check which port the backend is actually running on
- Look at the console output when starting the backend
- Update `NEXT_PUBLIC_API_URL` in `.env.local` to match

### Issue 3: CORS errors
**Solution:** Backend CORS configuration issue
- Check if backend allows requests from frontend origin
- Verify CORS settings in backend server configuration

### Issue 4: Database connection issues
**Solution:** Start the database
```bash
cd upstar-backend
docker-compose up -d postgres
```

## 📊 Step 4: Test Report Generation

1. **Start both servers:**
   ```bash
   # Terminal 1 - Backend
   cd upstar-backend
   npm run dev
   
   # Terminal 2 - Frontend
   cd upstar-website
   npm run dev
   ```

2. **Test the report generation:**
   - Open http://localhost:3000
   - Click "Generate Report" button
   - Check browser console for detailed logs

## 🔍 Debug Information

The updated API client now provides detailed logging:

- 🌐 API Request logs show the exact URL being called
- 📡 API Response logs show the server response
- ❌ Error logs show specific error details
- 🚨 Network Error logs show connection issues

## 📞 Still Having Issues?

1. **Check the browser console** for detailed error messages
2. **Verify backend logs** for any server-side errors
3. **Test the backend directly** by visiting http://localhost:5000/api/health
4. **Check network tab** in browser dev tools to see the actual HTTP requests

## 🎯 Expected Behavior

When working correctly:
1. Click "Generate Report" button
2. Button shows "Generating Report..." with spinning icon
3. Console shows: "🔄 Starting report generation..."
4. Console shows: "🌐 API Request: GET http://localhost:5000/api/dashboard/analytics-report"
5. Console shows: "📡 API Response: 200 OK"
6. Console shows: "✅ Report data received: [object]"
7. Console shows: "✅ Report generated and downloaded successfully"
8. Browser downloads the HTML report file
