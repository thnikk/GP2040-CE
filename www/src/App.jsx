import React, { useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';

import { AppContextProvider } from './Contexts/AppContext';

import useSystemStats from './Store/useSystemStats';
import Navigation from './Components/Navigation';

import HomePage from './Pages/HomePage';
import PinMappingPage from './Pages/PinMapping';
import PeripheralMappingPage from './Pages/PeripheralMappingPage';
import ResetSettingsPage from './Pages/ResetSettingsPage';
import SettingsPage from './Pages/SettingsPage';
import DisplayConfigPage from './Pages/DisplayConfig';
import LEDConfigPage from './Pages/LEDConfigPage';

import AddonsConfigPage from './Pages/AddonsConfigPage';
import BackupPage from './Pages/BackupPage';
import ConfigurationPage from './Pages/ConfigurationPage';
import PlaygroundPage from './Pages/PlaygroundPage';
import PinViewerPage from './Pages/PinViewerPage';
import InputMacroAddonPage from './Pages/InputMacroAddonPage';
import ButtonLayoutConfigPage from './Pages/ButtonLayoutConfigPage';

import './App.scss';

const App = () => {
	const { getSystemStats } = useSystemStats();

	useEffect(() => {
		getSystemStats();
	}, []);

	return (
		<AppContextProvider>
			<Router>
				<Navigation />
				<div className="body-content container-lg">
					<Routes>
						<Route path="/" element={<HomePage />} />
						<Route path="/settings" element={<SettingsPage />} />
						<Route path="/layout" element={<PinMappingPage />} />
						<Route path="/pin-mapping" element={<Navigate to="/layout" replace />} />
						<Route path="/button-layout" element={<ButtonLayoutConfigPage />} />
						<Route
							path="/peripheral-mapping"
							element={<PeripheralMappingPage />}
						/>
						<Route path="/reset-settings" element={<ResetSettingsPage />} />
						<Route path="/led-config" element={<LEDConfigPage />} />
						<Route path="/display-config" element={<DisplayConfigPage />} />
						<Route path="/add-ons" element={<AddonsConfigPage />} />
						<Route path="/backup" element={<BackupPage />} />
						<Route path="/playground" element={<PlaygroundPage />} />
						<Route path="/pin-viewer" element={<PinViewerPage />} />
						<Route path="/macro" element={<InputMacroAddonPage />} />
						<Route path="/configuration" element={<ConfigurationPage />} />
					</Routes>
				</div>
			</Router>
		</AppContextProvider>
	);
};

export default App;
