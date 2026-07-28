import React, { useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';

import { AppContextProvider } from './Contexts/AppContext';
import { ToastProvider } from './Contexts/ToastContext';

import useSystemStats from './Store/useSystemStats';
import Navigation from './components/layout/Navigation';
import Footer from './components/layout/Footer';

import HomePage from './Pages/HomePage';
import PinMappingPage from './Pages/PinMapping';
import SettingsPage from './Pages/SettingsPage';
import AddonsConfigPage from './Pages/AddonsConfigPage';
import ConfigurationPage from './Pages/ConfigurationPage';
import PlaygroundPage from './Pages/PlaygroundPage';

const App = () => {
	const { getSystemStats } = useSystemStats();

	useEffect(() => {
		getSystemStats();
	}, []);

	return (
		<AppContextProvider>
			<ToastProvider>
			<Router>
				<div className="app-layout">
					<Navigation />
					<div className="body-content container-lg">
						<Routes>
							<Route path="/" element={<HomePage />} />
							<Route path="/settings" element={<SettingsPage />} />
							<Route path="/layout" element={<PinMappingPage />} />
							<Route path="/pin-mapping" element={<Navigate to="/layout" replace />} />
							<Route
								path="/button-layout"
								element={<Navigate to="/configuration#button-layout" replace />}
							/>
							<Route
								path="/peripheral-mapping"
								element={<Navigate to="/configuration#peripheral-mapping" replace />}
							/>
							<Route
								path="/reset-settings"
								element={<Navigate to="/configuration#reset-settings" replace />}
							/>
							<Route
								path="/led-config"
								element={<Navigate to="/configuration#led-config" replace />}
							/>
							<Route
								path="/display-config"
								element={<Navigate to="/configuration#display-config" replace />}
							/>
							<Route path="/add-ons" element={<AddonsConfigPage />} />
							<Route
								path="/backup"
								element={<Navigate to="/configuration#backup" replace />}
							/>
							<Route path="/playground" element={<PlaygroundPage />} />
							<Route
								path="/macro"
								element={<Navigate to="/configuration#macro" replace />}
							/>
							<Route path="/configuration" element={<ConfigurationPage />} />
						</Routes>
					</div>
					<Footer />
				</div>
			</Router>
			</ToastProvider>
		</AppContextProvider>
	);
};

export default App;
