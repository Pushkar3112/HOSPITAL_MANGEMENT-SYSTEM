# Hospital Management System (HMS) - Frontend

A modern React-based frontend for the Hospital Management System with Redux state management, role-based dashboards, and Tailwind CSS styling.

## Features

- **Multi-Role Dashboard**: Separate interfaces for Patients, Doctors, and Admins
- **Doctor Booking**: Search and book appointments with available slots
- **Symptom Checker**: AI-powered symptom analysis using Gemini API
- **Medical History**: Access to prescriptions, medical records, and invoices
- **Real-time Updates**: Redux state management for seamless data flow
- **Responsive Design**: Mobile-friendly UI with Tailwind CSS
- **Toast Notifications**: User feedback for all actions
- **Protected Routes**: Role-based access control

## Tech Stack

- **Framework**: React 18
- **State Management**: Redux Toolkit
- **Routing**: React Router v6
- **Styling**: Tailwind CSS
- **HTTP Client**: Axios
- **Icons**: react-icons
- **UI Components**: Custom built components
- **Date Handling**: date-fns

## Project Structure

```
frontend/
├── public/
│   └── index.html           # HTML template
├── src/
│   ├── features/            # Redux slices
│   │   ├── authSlice.js     # Authentication state
│   │   ├── patientSlice.js  # Patient data
│   │   ├── doctorSlice.js   # Doctor data
│   │   ├── adminSlice.js    # Admin data
│   │   ├── uiSlice.js       # UI state (modals, toasts)
│   │   └── store.js         # Redux store configuration
│   ├── components/          # Reusable components
│   │   ├── Card.jsx         # Card container component
│   │   ├── Sidebar.jsx      # Navigation sidebar
│   │   ├── TopBar.jsx       # Top navigation bar
│   │   ├── Modal.jsx        # Modal dialog component
│   │   ├── Loading.jsx      # Loading skeletons
│   │   ├── ToastContainer.jsx  # Notification system
│   │   └── ProtectedRoute.jsx  # Route protection
│   ├── pages/               # Page components
│   │   ├── LandingPage.jsx     # Home page
│   │   ├── LoginPage.jsx       # Login form
│   │   ├── RegisterPage.jsx    # Registration form
│   │   ├── PatientDashboard.jsx    # Patient home
│   │   ├── DoctorBookingPage.jsx   # Appointment booking
│   │   ├── DoctorDashboard.jsx     # Doctor home
│   │   └── AdminDashboard.jsx      # Admin home
│   ├── services/            # API communication
│   │   ├── api.js           # Axios config with interceptors
│   │   └── index.js         # API service methods
│   ├── hooks/               # Custom React hooks
│   │   ├── useAuth.js       # Authentication hook
│   │   ├── usePatient.js    # Patient data hook
│   │   └── useDoctor.js     # Doctor data hook
│   ├── utils/               # Utility functions
│   │   └── dateUtils.js     # Date formatting functions
│   ├── App.jsx              # Main app component
│   ├── index.js             # React DOM root
│   └── index.css            # Global styles
├── tailwind.config.js       # Tailwind configuration
├── postcss.config.js        # PostCSS configuration
├── package.json
└── .gitignore
```

## Setup Instructions

### 1. Install Dependencies

```bash
cd frontend
npm install
```

### 2. Configure Environment (Optional)

Create a `.env` file if using a different API URL:

```bash
REACT_APP_API_URL=http://localhost:5000/api
```

Default is set to `http://localhost:5000/api`

### 3. Start Development Server

```bash
npm start
```

App runs on `http://localhost:3000`

## Authentication Flow

1. User logs in with email/password
2. Backend returns JWT access token and refresh token
3. Tokens stored in localStorage
4. Access token added to Authorization header for all requests
5. If access token expires, refresh token automatically gets new one
6. If refresh fails, user is redirected to login

## Redux State Structure

```javascript
{
  auth: {
    user: { id, name, email, role },
    accessToken: string,
    refreshToken: string,
    isLoading: boolean,
    error: string
  },
  patient: {
    profile: object,
    appointments: array,
    medicalHistory: array,
    prescriptions: array,
    invoices: array,
    isLoading: boolean,
    error: string
  },
  doctor: {
    profile: object,
    appointments: array,
    prescriptions: array,
    isLoading: boolean,
    error: string
  },
  admin: {
    stats: object,
    users: array,
    appointments: array,
    invoices: array,
    isLoading: boolean,
    error: string
  },
  ui: {
    modals: object,
    toasts: array,
    loading: boolean
  }
}
```

## Component Guidelines

### Using Cards

```jsx
import { Card, StatCard } from '../components/Card';

// Basic card
<Card title="My Title">
  <p>Card content here</p>
</Card>

// Stat card
<StatCard
  icon={<MdIcon />}
  label="Label"
  value="123"
  color="primary|success|warning|danger"
/>
```

### Using Modal

```jsx
import Modal from "../components/Modal";

const [isOpen, setIsOpen] = useState(false);

<Modal
  isOpen={isOpen}
  title="Modal Title"
  onClose={() => setIsOpen(false)}
  size="sm|md|lg"
>
  <p>Modal content</p>
</Modal>;
```

### Using Sidebar

```jsx
import Sidebar from "../components/Sidebar";

const items = [{ path: "/page", label: "Page", icon: <Icon /> }];

<Sidebar items={items} />;
```

## API Integration

### Making API Calls

```javascript
import { patientService } from "../services";

const data = await patientService.getAppointments();
```

### Error Handling

```javascript
try {
  const response = await patientService.getAppointments();
  // Handle success
} catch (error) {
  const message = error.response?.data?.message || "Error";
  // Handle error
}
```

## Custom Hooks

### useAuth Hook

```javascript
const { user, login, register, logout, accessToken } = useAuth();

await login(email, password);
await register(userData);
logout();
```

### usePatient Hook

```javascript
const { profile, appointments, loadProfile, loadAppointments, isLoading } =
  usePatient();

useEffect(() => {
  loadAppointments();
}, []);
```

## Styling with Tailwind

All global styles and utility classes are in `src/index.css`:

- `.btn`, `.btn-primary`, `.btn-secondary` - Buttons
- `.card` - Card containers
- `.badge`, `.badge-primary`, etc. - Badge labels
- `.toast` - Toast notifications
- `.skeleton` - Loading skeleton
- `.modal`, `.modal-overlay` - Modals

Use Tailwind classes inline for quick styling:

```jsx
<div className="flex gap-4 p-5 bg-white rounded-lg shadow-md">
```

## Date Utilities

```javascript
import {
  formatDate,
  formatDateTime,
  daysUntilAppointment,
  isCancelable,
} from "../utils/dateUtils";

formatDate(date); // "Dec 7, 2024"
formatTime(time); // "09:30"
formatDateTime(date, time); // "Dec 7, 2024 at 09:30"
daysUntilAppointment(date); // 5
isCancelable(date, time); // true/false (2-hour rule)
```

## Key Features

### Patient Dashboard

- View upcoming and completed appointments
- Book new appointments with doctors
- Search doctors by specialization, fee range
- View available time slots
- Cancel appointments (if allowed)
- Access medical history
- View prescriptions and invoices
- Symptom checker chatbot

### Doctor Dashboard

- View appointment requests
- Confirm or complete appointments
- Manage availability (days, hours, breaks)
- Create prescriptions
- View medical records
- Track daily appointments

### Admin Dashboard

- System statistics (users, appointments, revenue)
- User management (approve/reject doctors, block/unblock users)
- View all appointments and invoices
- Manage doctor registrations

## Building for Production

```bash
npm run build
```

Creates optimized build in `build/` folder.

Deployment on Vercel:

```bash
npm install -g vercel
vercel
```

## Troubleshooting

1. **API Connection Issues**

   - Check backend is running on port 5000
   - Verify REACT_APP_API_URL in .env
   - Check CORS settings in backend

2. **Authentication Issues**

   - Clear localStorage and refresh
   - Check token expiration
   - Verify JWT secrets match between backend and frontend

3. **Redux State Issues**

   - Use Redux DevTools browser extension
   - Check action names match reducer names
   - Verify dispatch is called with correct action

4. **Styling Issues**
   - Clear node_modules and reinstall
   - Rebuild Tailwind CSS: `npm run build:css`
   - Check tailwind.config.js includes all src files

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Performance Tips

- Use React.memo for components that don't need frequent re-renders
- Implement code splitting with React.lazy
- Optimize images and assets
- Use Redux selectors to prevent unnecessary re-renders

## Security Notes

- Never store sensitive data in localStorage (tokens auto-handled)
- Validate all user inputs
- Always use HTTPS in production
- Implement rate limiting on forms
- Use Content Security Policy headers

## Future Enhancements

- [ ] Dark mode toggle
- [ ] Appointment reminders
- [ ] Video consultation interface
- [ ] Prescription PDF export
- [ ] Advanced charts and analytics
- [ ] Notification preferences
- [ ] Multi-language support
- [ ] Offline support with service workers

## License

MIT License
