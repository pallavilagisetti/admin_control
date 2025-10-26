# SkillGraph AI - Admin Dashboard Frontend

A modern, responsive admin dashboard built with Next.js 14, TypeScript, and Tailwind CSS for managing the SkillGraph AI platform.

## 🚀 Features

- **Modern UI/UX**: Clean, responsive design with dark theme support
- **Authentication**: Secure login system with role-based access control
- **Real-time Analytics**: Live dashboard with real data from backend APIs
- **Report Generation**: Export comprehensive analytics reports
- **User Management**: Admin, Editor, and Viewer role support
- **Responsive Design**: Works seamlessly on desktop, tablet, and mobile

## 🛠️ Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Authentication**: Custom JWT-based auth system
- **State Management**: React Context API
- **HTTP Client**: Custom API client with error handling
- **Icons**: Heroicons (SVG)

## 📋 Prerequisites

- Node.js 18+ 
- npm or yarn
- Backend API running on port 5000

## 🚀 Quick Start

### 1. Install Dependencies

```bash
npm install
# or
yarn install
```

### 2. Environment Setup

Create a `.env.local` file in the root directory:

```env
NEXT_PUBLIC_API_URL=http://localhost:5000
```

### 3. Start Development Server

```bash
npm run dev
# or
yarn dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 🔐 Authentication

### Test Accounts

The application comes with pre-configured test accounts:

| Role | Email | Password |
|------|-------|----------|
| Admin | pallavigisetti12003@gmail.com | admin123 |
| Editor | lagisettipallavi607@gmail.com | editor123 |
| Viewer | pallusweety67@gmail.com | viewer123 |

### Login Process

1. Navigate to `/login`
2. Enter credentials from the table above
3. You'll be redirected to the dashboard upon successful login

## 📊 Dashboard Features

### Analytics Overview
- **User Statistics**: Total users, active users, growth metrics
- **Resume Processing**: Upload counts, processing status, completion rates
- **Job Management**: Job postings, applications, recent activity
- **Revenue Tracking**: Total revenue, period growth, payment status
- **System Health**: API performance, response times, success rates

### Report Generation
- **Real Data**: Reports use actual database data (not mock data)
- **Multiple Formats**: HTML reports with comprehensive analytics
- **Authentication Required**: Must be logged in to generate reports
- **Download**: Automatic download of generated reports

### User Management
- **Role-based Access**: Different permissions for Admin, Editor, Viewer
- **Session Management**: Secure token-based authentication
- **Logout**: Secure session termination

## 🏗️ Project Structure

```
upstar-website/
├── src/
│   ├── app/                    # Next.js App Router pages
│   │   ├── login/             # Login page
│   │   ├── page.tsx           # Dashboard home
│   │   └── layout.tsx         # Root layout
│   ├── components/            # Reusable components
│   │   └── AuthStatusChecker.tsx
│   ├── contexts/              # React contexts
│   │   └── AuthContext.tsx    # Authentication context
│   ├── lib/                   # Utility libraries
│   │   ├── api-client.ts     # API client
│   │   └── auth.ts           # Authentication utilities
│   └── styles/               # Global styles
├── public/                   # Static assets
├── .env                     # Environment variables
├── .gitignore              # Git ignore rules
└── package.json            # Dependencies and scripts
```

## 🔧 Configuration

### API Client Configuration

The API client (`src/lib/api-client.ts`) handles:
- **Base URL**: Configurable via `NEXT_PUBLIC_API_URL`
- **Authentication**: Automatic token inclusion
- **Error Handling**: Comprehensive error management
- **Request/Response Logging**: Debug-friendly logging

### Authentication Flow

1. **Login**: User enters credentials
2. **Token Generation**: JWT-like token created with mock signature
3. **Storage**: Token stored in localStorage as `admin_access_token`
4. **API Calls**: Token automatically included in requests
5. **Validation**: Backend validates token and grants access

## 🚨 Troubleshooting

### Common Issues

#### 1. "Failed to generate remote" Error
- **Cause**: Backend not running or wrong port
- **Solution**: Ensure backend is running on port 5000

#### 2. "401 Unauthorized" Error
- **Cause**: Not logged in or expired token
- **Solution**: Log in using test credentials

#### 3. CORS Errors
- **Cause**: Backend CORS configuration
- **Solution**: Check backend CORS settings

### Debug Steps

1. **Check Console**: Open browser DevTools for error messages
2. **Verify Backend**: Ensure backend is running on port 5000
3. **Check Authentication**: Verify you're logged in
4. **Network Tab**: Check API requests in browser DevTools

## 📱 Responsive Design

The dashboard is fully responsive and works on:
- **Desktop**: Full feature set with optimal layout
- **Tablet**: Adapted layout with touch-friendly controls
- **Mobile**: Compact design with essential features

## 🎨 Theme Support

- **Dark Theme**: Default dark theme with CSS variables
- **Customizable**: Easy to modify colors via CSS variables
- **Consistent**: Unified design system across all components

## 🔒 Security Features

- **Token-based Authentication**: Secure JWT-like tokens
- **Role-based Access**: Different permissions per role
- **Input Validation**: Client-side form validation
- **Secure Storage**: Tokens stored securely in localStorage

## 📈 Performance

- **Next.js Optimization**: Built-in performance optimizations
- **Code Splitting**: Automatic code splitting for faster loads
- **Image Optimization**: Next.js image optimization
- **Caching**: Intelligent caching strategies

## 🧪 Testing

### Manual Testing Checklist

- [ ] Login with all three test accounts
- [ ] Generate analytics report
- [ ] Verify responsive design on different screen sizes
- [ ] Test logout functionality
- [ ] Check error handling for network issues

## 🚀 Deployment

### Production Build

```bash
npm run build
npm start
```

### Environment Variables for Production

```env
NEXT_PUBLIC_API_URL=https://your-backend-domain.com
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is part of the SkillGraph AI platform.

## 🆘 Support

For issues and questions:
1. Check the troubleshooting section above
2. Review console logs for error details
3. Ensure backend is running and accessible
4. Verify authentication status

---

**Note**: This is the frontend admin dashboard for SkillGraph AI. Make sure the backend API is running on port 5000 for full functionality.
