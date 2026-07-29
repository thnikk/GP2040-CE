import React, { useContext, useEffect, useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { AppContext } from '../../Contexts/AppContext';
import SunIcon from '../../Icons/Sun';
import MoonStarsIcon from '../../Icons/MoonStars';
import CircleHalfIcon from '../../Icons/CircleHalf';
import InfoCircle from '../../Icons/InfoCircle';
import GitHub from '../../Icons/GitHub';
import LanguageSelector from '../shared/LanguageSelector';
import useSystemStats from '../../Store/useSystemStats';
import { isNewerVersion } from '../../Services/Utilities';
import SystemStatsPopover from '../shared/SystemStatsPopover';

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

const ArrowUpCircle = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 512 512"
    width="16"
    height="16"
    fill="currentColor"
  >
    <path d="M256 512A256 256 0 1 0 256 0a256 256 0 1 0 0 512zM385 215c9.4 9.4 9.4 24.6 0 33.9s-24.6 9.4-33.9 0l-71-71L280 392c0 13.3-10.7 24-24 24s-24-10.7-24-24l0-214.1-71 71c-9.4 9.4-24.6 9.4-33.9 0s-9.4-24.6 0-33.9L239 103c9.4-9.4 24.6-9.4 33.9 0L385 215z" />
  </svg>
);

const Footer = () => {
  const { savedColorScheme, setSavedColorScheme } = useContext(AppContext);
  const { t } = useTranslation('');
  const [popoverOpen, setPopoverOpen] = useState(false);
  const triggerRef = useRef(null);
  const { currentVersion, latestVersion, loaded } = useSystemStats();

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

  const updateAvailable =
    loaded &&
    latestVersion &&
    currentVersion?.split('-').length === 1 &&
    isNewerVersion(latestVersion, currentVersion);

  return (
    <footer className="footer container-lg">
      <div className="footer-inner">
        <div className="footer-info-trigger">
          {loaded && (
            <>
            <button
              type="button"
              ref={triggerRef}
              className={`icon-btn${updateAvailable ? ' update-available' : ''}`}
              onClick={() => setPopoverOpen(!popoverOpen)}
              aria-label={t('Components:footer.system-stats')}
            >
              {updateAvailable ? <ArrowUpCircle /> : <InfoCircle />}
            </button>
          <span className="footer-version">{currentVersion}</span>
          </>
          )}
          <SystemStatsPopover
            show={popoverOpen}
            onHide={() => setPopoverOpen(false)}
            triggerRef={triggerRef}
          />
        </div>
        <div className="theme-toggle">
          {themes.map(({ scheme, icon: Icon }) => (
            <button
              key={scheme}
              className={`theme-btn${savedColorScheme === scheme ? ' active' : ''}`}
              title={scheme}
              onClick={() => setThemeAndState(scheme)}
            >
              <Icon />
            </button>
          ))}
        </div>
        <div>
          <LanguageSelector />
          <a
            href="https://github.com/thnikk/GP2040-th"
            target="_blank"
            rel="noopener noreferrer"
            className="icon-btn"
            aria-label={t('Components:footer.github')}
          >
            <GitHub />
          </a>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
