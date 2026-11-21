import './globals.css';
import { AuthProvider } from '../context/AuthContext';
import { ThemeProvider } from '../context/ThemeContext';
import { Toaster } from 'react-hot-toast';
import ServiceWorkerRegister from '../components/ServiceWorkerRegister';
import QueryProvider from '../context/QueryProvider';

export const metadata = {
  title: 'AICTE FDR Vault — Transparent. Tracked. Timely.',
  description: 'AICTE Fixed Deposit & Security Deposit Vault Portal. SIH 2026 Problem ID SIH26265.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased min-h-screen bg-slate-50 dark:bg-slate-950">
        <ThemeProvider>
          <AuthProvider>
            <QueryProvider>
              <ServiceWorkerRegister />
              {children}
            </QueryProvider>
            <Toaster
              position="top-right"
              toastOptions={{
                duration: 4000,
                style: {
                  borderRadius: '12px',
                  background: '#1e293b',
                  color: '#fff',
                  fontSize: '13px',
                },
              }}
            />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
