'use client';
import React, { createContext, useContext, useState, useCallback } from 'react';

// ─── Translations ────────────────────────────────────────────────────────────
const translations = {
  en: {
    // Navbar
    nav: {
      home: 'Home',
      dashboard: 'Dashboard',
      admin: 'Admin',
      login: 'Login',
      register: 'Register',
      logout: 'Logout',
    },
    // Dashboard
    dashboard: {
      welcome: 'Welcome back',
      subtitle: 'Great to see you! Here is your personal space.',
      memberSince: 'Member since',
      email: 'Email',
      accountType: 'Account type',
      user: 'User',
      administrator: 'Administrator',
      sendMessage: 'Send a Message',
      sendMessageDesc: 'Got something on your mind? Drop the site owner a message.',
      quickLinks: 'Quick Links',
      visitPortfolio: 'Visit Portfolio',
      visitPortfolioDesc: 'Browse the projects and CV on the homepage.',
      goToHome: 'Go to Homepage',
      accountInfo: 'Account Info',
      username: 'Username',
      yourMessage: 'Your Message',
      messagePlaceholder: 'Type your message here...',
      send: 'Send',
      sending: 'Sending…',
      messageSent: 'Message sent successfully!',
      messageEmpty: 'Message cannot be empty.',
      messageFailed: 'Failed to send message.',
    },
  },
  de: {
    nav: {
      home: 'Home',
      dashboard: 'Dashboard',
      admin: 'Admin',
      login: 'Anmelden',
      register: 'Registrieren',
      logout: 'Abmelden',
    },
    dashboard: {
      welcome: 'Willkommen zurück',
      subtitle: 'Schön, dich zu sehen! Hier ist dein persönlicher Bereich.',
      memberSince: 'Mitglied seit',
      email: 'E-Mail',
      accountType: 'Kontotyp',
      user: 'Benutzer',
      administrator: 'Administrator',
      sendMessage: 'Nachricht senden',
      sendMessageDesc: 'Hast du etwas auf dem Herzen? Schreib dem Seiteninhaber eine Nachricht.',
      quickLinks: 'Schnellzugriff',
      visitPortfolio: 'Portfolio besuchen',
      visitPortfolioDesc: 'Projekte und Lebenslauf auf der Startseite erkunden.',
      goToHome: 'Zur Startseite',
      accountInfo: 'Kontoinformationen',
      username: 'Benutzername',
      yourMessage: 'Deine Nachricht',
      messagePlaceholder: 'Schreib hier deine Nachricht...',
      send: 'Senden',
      sending: 'Sende…',
      messageSent: 'Nachricht erfolgreich gesendet!',
      messageEmpty: 'Nachricht darf nicht leer sein.',
      messageFailed: 'Nachricht konnte nicht gesendet werden.',
    },
  },
};

// ─── Context ──────────────────────────────────────────────────────────────────
const LanguageContext = createContext({
  language: 'en',
  setLanguage: () => {},
  t: (section, key) => key,
});

export const LanguageProvider = ({ children }) => {
  const [language, setLanguage] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('language') || 'en';
    }
    return 'en';
  });

  const changeLanguage = useCallback((lang) => {
    setLanguage(lang);
    if (typeof window !== 'undefined') {
      localStorage.setItem('language', lang);
    }
  }, []);

  /**
   * t('dashboard', 'welcome') → translated string
   */
  const t = useCallback((section, key) => {
    return translations[language]?.[section]?.[key]
      ?? translations['en']?.[section]?.[key]
      ?? key;
  }, [language]);

  return (
    <LanguageContext.Provider value={{ language, setLanguage: changeLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);
export default LanguageContext;
