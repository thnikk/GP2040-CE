import React, { useContext, useState } from 'react';
import { Nav, NavDropdown, Navbar, Button, Modal } from 'react-bootstrap';
import { NavLink, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { AppContext } from '../Contexts/AppContext';
import FormSelect from './FormSelect';
import { saveButtonLabels } from '../Services/Storage';
import { BUTTONS } from '../Data/Buttons';
import './Navigation.scss';
import WebApi from '../Services/WebApi';
import ColorScheme from './ColorScheme';
import LanguageSelector from './LanguageSelector';

const BOOT_MODES = {
	GAMEPAD: 0,
	WEBCONFIG: 1,
	BOOTSEL: 2,
};

const Navigation = () => {
	const { buttonLabels, setButtonLabels } = useContext(AppContext);

	const [show, setShow] = useState(false);
	const [isRebooting, setIsRebooting] = useState(null); // null because we want the button to assume untouched state

	const handleClose = () => setShow(false);
	const handleShow = () => {
		setIsRebooting(null);
		setShow(true);
	};
	const handleReboot = async (bootMode) => {
		if (isRebooting === false) {
			setShow(false);
			return;
		}
		setIsRebooting(bootMode);
		await WebApi.reboot(bootMode);
		setIsRebooting(-1);
	};

	const updateButtonLabels = (e) => {
		saveButtonLabels(e.target.value);
		setButtonLabels({ buttonLabelType: e.target.value });
	};

	const { t } = useTranslation('');
	const location = useLocation();

	// eventKey prop is required on NavLink components in order for mobile menu
	// to autoclose, so just auto increment as we build the menu
	let eventKey = 0;

	return (
		<Navbar collapseOnSelect expand="md" fixed="top">
			<Navbar.Brand title={`GP2040-CE ${t('Navigation:home-label')}`}>
				<Nav.Link as={NavLink} to="/" eventKey={eventKey++}>
					<img
						src="images/logo.svg"
						className="title-logo"
						alt="GP2040-CE logo"
					/>
				</Nav.Link>
			</Navbar.Brand>
			<Navbar.Toggle aria-controls="responsive-navbar-nav" />
			<Navbar.Collapse id="basic-navbar-nav">
				<Nav className="me-auto nav-menu" activeKey={location.pathname}>
					<Nav.Link as={NavLink} to="/layout" eventKey="/layout">
						<span style={{ display: 'inline-flex', alignItems: 'center' }}>
							<svg
								viewBox="0 0 640 384"
								fill="currentColor"
								style={{ marginRight: '0.5rem' }}
							>
								<path d="M 192,0 C 86,0 0,86 0,192 0,298 86,384 192,384 H 448 C 554,384 640,298 640,192 640,86 554,0 448,0 Z m 304,104 a 40,40 0 1 1 0,80 40,40 0 1 1 0,-80 z M 392,240 a 40,40 0 1 1 80,0 40,40 0 1 1 -80,0 z M 168,136 c 0,-13.3 10.7,-24 24,-24 13.3,0 24,10.7 24,24 v 32 h 32 c 13.3,0 24,10.7 24,24 0,13.3 -10.7,24 -24,24 h -32 v 32 c 0,13.3 -10.7,24 -24,24 -13.3,0 -24,-10.7 -24,-24 v -32 h -32 c -13.3,0 -24,-10.7 -24,-24 0,-13.3 10.7,-24 24,-24 h 32 z"/>
							</svg>
							{t('Navigation:layout-label')}
						</span>
					</Nav.Link>
					<Nav.Link as={NavLink} to="/settings" eventKey="/settings">
						<span style={{ display: 'inline-flex', alignItems: 'center' }}>
							<svg
								viewBox="0 0 512 512"
								fill="currentColor"
								style={{ marginRight: '0.5rem' }}
							>
								<path d="M495.9 166.6c3.2 8.7 .5 18.4-6.4 24.6l-43.3 39.4c1.1 8.3 1.7 16.8 1.7 25.4s-.6 17.1-1.7 25.4l43.3 39.4c6.9 6.2 9.6 15.9 6.4 24.6c-4.4 11.9-9.7 23.3-15.8 34.3l-4.7 8.1c-6.6 11-14 21.4-22.1 31.2c-5.9 7.2-15.7 9.6-24.5 6.8l-55.7-17.7c-13.4 10.3-28.2 18.9-44 25.4l-12.5 57.1c-2 9.1-9 16.3-18.2 17.8c-13.8 2.3-28 3.5-42.5 3.5s-28.7-1.2-42.5-3.5c-9.2-1.5-16.2-8.7-18.2-17.8l-12.5-57.1c-15.8-6.5-30.6-15.1-44-25.4L83.1 425.9c-8.8 2.8-18.6 .3-24.5-6.8c-8.1-9.8-15.5-20.2-22.1-31.2l-4.7-8.1c-6.1-11-11.4-22.4-15.8-34.3c-3.2-8.7-.5-18.4 6.4-24.6l43.3-39.4C64.6 273.1 64 264.6 64 256s.6-17.1 1.7-25.4L22.4 191.2c-6.9-6.2-9.6-15.9-6.4-24.6c4.4-11.9 9.7-23.3 15.8-34.3l4.7-8.1c6.6-11 14-21.4 22.1-31.2c5.9-7.2 15.7-9.6 24.5-6.8l55.7 17.7c13.4-10.3 28.2-18.9 44-25.4l12.5-57.1c2-9.1 9-16.3 18.2-17.8C227.3 1.2 241.5 0 256 0s28.7 1.2 42.5 3.5c9.2 1.5 16.2 8.7 18.2 17.8l12.5 57.1c15.8 6.5 30.6 15.1 44 25.4l55.7-17.7c8.8-2.8 18.6-.3 24.5 6.8c8.1 9.8 15.5 20.2 22.1 31.2l4.7 8.1c6.1 11 11.4 22.4 15.8 34.3zM256 336a80 80 0 1 0 0-160 80 80 0 1 0 0 160z"/>
							</svg>
							{t('Navigation:settings-label')}
						</span>
					</Nav.Link>
					{/* <NavDropdown title={t('Navigation:config-label')}>
						<NavDropdown.Item
							as={NavLink}
							eventKey={eventKey++}
							to="/peripheral-mapping"
						>
							{t('Navigation:peripheral-mapping-label')}
						</NavDropdown.Item>
						<NavDropdown.Item
							as={NavLink}
							eventKey={eventKey++}
							to="/button-layout"
						>
							{t('Navigation:button-layout-label')}
						</NavDropdown.Item>
						<NavDropdown.Item
							as={NavLink}
							eventKey={eventKey++}
							to="/led-config"
						>
							{t('Navigation:led-config-label')}
						</NavDropdown.Item>
						<NavDropdown.Item
							as={NavLink}
							eventKey={eventKey++}
							to="/display-config"
						>
							{t('Navigation:display-config-label')}
						</NavDropdown.Item>
						<NavDropdown.Item as={NavLink} eventKey={eventKey++} to="/add-ons">
							{t('Navigation:add-ons-label')}
						</NavDropdown.Item>
						<NavDropdown.Item as={NavLink} eventKey={eventKey++} to="/macro">
							{t('Navigation:macro-label')}
						</NavDropdown.Item>
						<NavDropdown.Item as={NavLink} eventKey={eventKey++} to="/backup">
							{t('Navigation:backup-label')}
						</NavDropdown.Item>
						<NavDropdown.Item
							as={NavLink}
							eventKey={eventKey++}
							to="/reset-settings"
						>
							<span className="reset-settings-link">
								{t('Navigation:resetSettings-label')}
							</span>
						</NavDropdown.Item>
					</NavDropdown> */}
					{/* <NavDropdown title={t('Navigation:links-label')}>
						<NavDropdown.Item href="https://gp2040-ce.info/" target="_blank">
							{t('Navigation:docs-label')}
						</NavDropdown.Item>
						<NavDropdown.Item
							href="https://github.com/OpenStickCommunity/GP2040-CE"
							target="_blank"
						>
							{t('Navigation:github-label')}
						</NavDropdown.Item>
					</NavDropdown> */}
				</Nav>
				<Nav className="navbar-actions">
					<Button variant="success" onClick={handleShow} aria-label={t('Navigation:reboot-label')}>
						<svg
							width="16"
							height="16"
							viewBox="0 0 18.625 18.625"
							fill="none"
							stroke="currentColor"
							strokeLinecap="round"
							strokeLinejoin="round"
						>
							<path
								d="m 4.5,1.5 c -2.4138473,1.3772943 -4,4.0219409 -4,7 0,4.418278 3.581722,8 8,8 4.418278,0 8,-3.581722 8,-8 0,-4.418278 -3.581722,-8 -8,-8"
								strokeWidth="2.625"
							/>
							<path
								d="m 4.5,5.5 v -4 h -4"
								strokeWidth="2.625"
							/>
						</svg>
					</Button>
					<ColorScheme />
					<LanguageSelector />
					<div className="navbar-label-select">
						<FormSelect
							name="buttonLabels"
							className="form-select"
							value={buttonLabels.buttonLabelType}
							onChange={updateButtonLabels}
						>
							{Object.keys(BUTTONS).map((b, i) => (
								<option
									key={`button-label-option-${i}`}
									value={BUTTONS[b].value}
								>
									{BUTTONS[b].label}
								</option>
							))}
						</FormSelect>
					</div>
					<a
						href="https://github.com/thnikk/GP2040-CE"
						target="_blank"
						rel="noopener noreferrer"
						className="github-link"
					>
						<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
							<path d="M216.5 362.5c-66-8-112.5-55.5-112.5-117 0-25 9-52 24-70-6.5-16.5-5.5-51.5 2-66 20-2.5 47 8 63 22.5 19-6 39-9 63.5-9s44.5 3 62.5 8.5c15.5-14 43-24.5 63-22 7 13.5 8 48.5 1.5 65.5 16 19 24.5 44.5 24.5 70.5 0 61.5-46.5 108-113.5 116.5 17 11 28.5 35 28.5 62.5l0 52C323 491.5 335.5 500 350.5 494 441 459.5 512 369 512 257 512 115.5 397 0 255.5 0S0 115.5 0 257c0 111 70.5 203 165.5 237.5 13.5 5 26.5-4 26.5-17.5l0-40c-7 3-16 5-24 5-33 0-52.5-18-66.5-51.5-5.5-13.5-11.5-21.5-23-23-6-.5-8-3-8-6 0-6 10-10.5 20-10.5 14.5 0 27 9 40 27.5 10 14.5 20.5 21 33 21s20.5-4.5 32-16c8.5-8.5 15-16 21-21z"/>
						</svg>
					</a>
				</Nav>
			</Navbar.Collapse>

			<Modal show={show} onHide={handleClose}>
				<Modal.Header closeButton>
					<Modal.Title>{t('Navigation:reboot-modal-label')}</Modal.Title>
				</Modal.Header>
				<Modal.Body>
					{isRebooting === -1
						? t('Navigation:reboot-modal-success')
						: t('Navigation:reboot-modal-body')}
				</Modal.Body>
				<Modal.Footer>
					<Button
						variant="secondary"
						onClick={() => handleReboot(BOOT_MODES.BOOTSEL)}
					>
						{isRebooting !== BOOT_MODES.BOOTSEL
							? t('Navigation:reboot-modal-button-bootsel-label')
							: isRebooting
								? t('Navigation:reboot-modal-button-progress-label')
								: t('Navigation:reboot-modal-button-success-label')}
					</Button>
					<Button
						variant="primary"
						onClick={() => handleReboot(BOOT_MODES.WEBCONFIG)}
					>
						{isRebooting !== BOOT_MODES.WEBCONFIG
							? t('Navigation:reboot-modal-button-web-config-label')
							: isRebooting
								? t('Navigation:reboot-modal-button-progress-label')
								: t('Navigation:reboot-modal-button-success-label')}
					</Button>
					<Button
						variant="success"
						onClick={() => handleReboot(BOOT_MODES.GAMEPAD)}
					>
						{isRebooting !== BOOT_MODES.GAMEPAD
							? t('Navigation:reboot-modal-button-controller-label')
							: isRebooting
								? t('Navigation:reboot-modal-button-progress-label')
								: t('Navigation:reboot-modal-button-success-label')}
					</Button>
				</Modal.Footer>
			</Modal>
		</Navbar>
	);
};

export default Navigation;
