import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '@/contexts/AuthContext';
import { Toaster } from 'react-hot-toast';

export const metadata: Metadata = {
  title: 'TradeJournal — Professional Trading Journal',
  description: 'Track, analyze, and improve your trading performance with professional-grade journaling tools.',
  keywords: 'trade journal, trading journal, forex journal, stock journal, trading tracker, P&L tracker',
  openGraph: {
    title: 'TradeJournal — Professional Trading Journal',
    description: 'Track, analyze, and improve your trading performance.',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          {children}
          <Toaster
            position="bottom-right"
            toastOptions={{
              style: {
                background: '#1a1a1f',
                color: '#e8e8f0',
                border: '1px solid #2a2a35',
                borderRadius: '10px',
                fontSize: '13px',
              },
              success: {
                iconTheme: {
                  primary: '#00e676',
                  secondary: '#000',
                },
              },
              error: {
                iconTheme: {
                  primary: '#ff5252',
                  secondary: '#fff',
                },
              },
            }}
          />
        </AuthProvider>
      </body>
    </html>
  );
}
