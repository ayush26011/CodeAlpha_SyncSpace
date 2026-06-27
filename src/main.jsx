import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

import { AuthProvider } from './context/AuthContext'
import { ChatProvider } from './context/ChatContext'
import { CallProvider } from './context/CallContext'
import { MeetingProvider } from './context/MeetingContext'
import { SettingsProvider } from './context/SettingsContext'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AuthProvider>
      <ChatProvider>
        <CallProvider>
          <MeetingProvider>
            <SettingsProvider>
              <App />
            </SettingsProvider>
          </MeetingProvider>
        </CallProvider>
      </ChatProvider>
    </AuthProvider>
  </StrictMode>,
)
