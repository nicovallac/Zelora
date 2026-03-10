import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { NotificationProvider } from './contexts/NotificationContext';
import { ToastContainer } from './components/ui/Toast';
import './index.css';
import App from './App';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <NotificationProvider>
          <App />
          <ToastContainer />
        </NotificationProvider>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>
);
