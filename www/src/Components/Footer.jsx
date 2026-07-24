import React, { useContext, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { AppContext } from '../Contexts/AppContext';
import SunIcon from '../Icons/Sun';
import MoonStarsIcon from '../Icons/MoonStars';
import CircleHalfIcon from '../Icons/CircleHalf';
import './Footer.css';

const setTheme = (theme) => {
  const rootElement = document.documentElement;
  const prefersDarkMode = window.matchMedia(
    '(prefers-color-scheme: dark)',
  ).matches;

  if (theme === 'auto') {
    rootElement.setAttribute(
      'data-theme',
      prefersDarkMode ? 'dark' : 'light',
    );
  } else {
    rootElement.setAttribute('data-theme', theme);
  }
};

const Footer = () => {
  const { savedColorScheme, setSavedColorScheme } = useContext(AppContext);
  const { t } = useTranslation('');

  useEffect(() => {
    setTheme(savedColorScheme);
  }, []);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = () => {
      if (savedColorScheme === 'auto') {
        setTheme('auto');
      }
    };
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, [savedColorScheme]);

  const setThemeAndState = (newColorScheme) => {
    setTheme(newColorScheme);
    setSavedColorScheme(newColorScheme);
  };

  const themes = [
    { scheme: 'light', icon: SunIcon },
    { scheme: 'dark', icon: MoonStarsIcon },
    { scheme: 'auto', icon: CircleHalfIcon },
  ];

  return (
    <footer className="footer container-lg">
      <div className="footer-inner">
        <span>{t('Components:footer.copyright', { year: new Date().getFullYear() })}</span>
        <div className="theme-toggle">
          {themes.map(({ scheme, icon: Icon }) => (
            <button
              key={scheme}
              className={`theme-btn${savedColorScheme === scheme ? ' active' : ''}`}
              data-theme={scheme}
              title={scheme}
              onClick={() => setThemeAndState(scheme)}
            >
              <Icon />
            </button>
          ))}
        </div>
        <div>
          <a
            href="https://github.com/thnikk/GP2040-CE"
            target="_blank"
            rel="noopener noreferrer"
            className="icon-btn"
            aria-label={t('Components:footer.github')}
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" fill="currentColor" width="1.35em" height="1.35em">
              <path d="M216.5 362.5c-66-8-112.5-55.5-112.5-117 0-25 9-52 24-70-6.5-16.5-5.5-51.5 2-66 20-2.5 47 8 63 22.5 19-6 39-9 63.5-9s44.5 3 62.5 8.5c15.5-14 43-24.5 63-22 7 13.5 8 48.5 1.5 65.5 16 19 24.5 44.5 24.5 70.5 0 61.5-46.5 108-113.5 116.5 17 11 28.5 35 28.5 62.5l0 52C323 491.5 335.5 500 350.5 494 441 459.5 512 369 512 257 512 115.5 397 0 255.5 0S0 115.5 0 257c0 111 70.5 203 165.5 237.5 13.5 5 26.5-4 26.5-17.5l0-40c-7 3-16 5-24 5-33 0-52.5-18-66.5-51.5-5.5-13.5-11.5-21.5-23-23-6-.5-8-3-8-6 0-6 10-10.5 20-10.5 14.5 0 27 9 40 27.5 10 14.5 20.5 21 33 21s20.5-4.5 32-16c8.5-8.5 15-16 21-21z"/>
            </svg>
          </a>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
