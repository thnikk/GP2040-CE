import React, { useState } from 'react';
import { Nav, Navbar, Button, Modal } from 'react-bootstrap';
import { NavLink, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import './Navigation.scss';
import WebApi from '../Services/WebApi';
import ColorScheme from './ColorScheme';
import LanguageSelector from './LanguageSelector';
import useSystemStats from '../Store/useSystemStats';

const BOOT_MODES = {
	GAMEPAD: 0,
	WEBCONFIG: 1,
	BOOTSEL: 2,
};

const Navigation = () => {
	const showConfigButton = useSystemStats((state) => state.showConfigButton);
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

	const { t } = useTranslation('');
	const location = useLocation();

	// eventKey prop is required on NavLink components in order for mobile menu
	// to autoclose, so just auto increment as we build the menu
	let eventKey = 0;

	return (
		<Navbar collapseOnSelect expand="md" fixed="top">
			<Navbar.Brand title={`GP2040-CE ${t('Navigation:home-label')}`}>
				<Nav.Link as={NavLink} to="/" eventKey={eventKey++} className="logo-link">
					<svg
						viewBox="0 0 228.846 121.94489"
						className="title-logo"
						xmlns="http://www.w3.org/2000/svg"
						height="40"
					>
						<defs>
							<mask
								maskUnits="userSpaceOnUse"
								id="navbar-logo-mask"
							>
								<path
									fill="#ffffff"
									d="M -1,-1 H 229.84601 V 122.94489 H -1 Z"
								/>
								<path
									fill="none"
									stroke="#000000"
									strokeWidth="20"
									strokeLinecap="round"
									d="m 141.1483,87.697756 a 37.795276,37.795276 0 1 0 0,-53.4506 l -53.4506,53.45 a 37.7953,37.7953 0 1 1 0,-53.4506"
								/>
							</mask>
						</defs>
						<rect
							fill="currentColor"
							rx="60.972446"
							ry="60.972446"
							width="228.846"
							height="121.945"
							mask="url(#navbar-logo-mask)"
						/>
					</svg>
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
					<Nav.Link as={NavLink} to="/pin-viewer" eventKey="/pin-viewer">
						<span style={{ display: 'inline-flex', alignItems: 'center' }}>
							<svg
								viewBox="0 0 512 512"
								fill="currentColor"
								style={{ marginRight: '0.5rem' }}
							>
								<path d="M256 512c141.4 0 256-114.6 256-256S397.4 0 256 0S0 114.6 0 256S114.6 512 256 512zm97.6-353.4c4.7-2.7 10.6-2.1 14.6 1.4s5.4 9.1 3.5 13.9l-46.4 116 116-46.4c4.8-1.9 9.3-1 12.8 2.6s4.1 9.4 1.4 14.1l-160 272c-3.1 5.3-9 8.2-15.1 7.6s-11.4-4.2-13.6-9.9l-45.7-114.2L106.8 371c-5.8 2.2-12.2 .9-16.4-3.4s-5.1-10.7-2.3-16L248 192c3.4-6.4 10.6-9.8 17.8-8.5s12.8 6.5 14.5 13.6l32.2 128.7 121.2-181.8c2.9-4.3 8-6.5 13.1-6.1l6.8 .5z"/>
							</svg>
							{t('Navigation:pin-viewer-label')}
						</span>
					</Nav.Link>
					
					{/* <NavDropdown title={t('Navigation:links-label')}>
						<NavDropdown.Item href="https://gp2040-ce.info/" target="_blank">
							{t('Navigation:docs-label')}
						</NavDropdown.Item>
						<NavDropdown.Item
							href="https://github.com/thnikk/GP2040-CE"
							target="_blank"
						>
							{t('Navigation:github-label')}
						</NavDropdown.Item>
					</NavDropdown> */}
				</Nav>
				<Nav className="navbar-actions">
					<Button variant="success" onClick={handleShow} aria-label={t('Navigation:reboot-label')} className="icon-btn">
						<svg
							width="20"
							height="20"
							viewBox="-2 -2 22.625 22.625"
							fill="none"
							stroke="currentColor"
							strokeLinecap="round"
							strokeLinejoin="round"
							style={{ height: '1.35em', width: 'auto' }}
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
					<Button
						variant="secondary"
						href="https://github.com/thnikk/GP2040-CE"
						target="_blank"
						rel="noopener noreferrer"
						className="icon-btn text-reset"
						aria-label="GitHub"
					>
						<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" fill="currentColor">
							<path d="M216.5 362.5c-66-8-112.5-55.5-112.5-117 0-25 9-52 24-70-6.5-16.5-5.5-51.5 2-66 20-2.5 47 8 63 22.5 19-6 39-9 63.5-9s44.5 3 62.5 8.5c15.5-14 43-24.5 63-22 7 13.5 8 48.5 1.5 65.5 16 19 24.5 44.5 24.5 70.5 0 61.5-46.5 108-113.5 116.5 17 11 28.5 35 28.5 62.5l0 52C323 491.5 335.5 500 350.5 494 441 459.5 512 369 512 257 512 115.5 397 0 255.5 0S0 115.5 0 257c0 111 70.5 203 165.5 237.5 13.5 5 26.5-4 26.5-17.5l0-40c-7 3-16 5-24 5-33 0-52.5-18-66.5-51.5-5.5-13.5-11.5-21.5-23-23-6-.5-8-3-8-6 0-6 10-10.5 20-10.5 14.5 0 27 9 40 27.5 10 14.5 20.5 21 33 21s20.5-4.5 32-16c8.5-8.5 15-16 21-21z"/>
						</svg>
					</Button>
					{showConfigButton && (
						<Button
							variant="secondary"
							as={NavLink}
							to="/configuration"
							className="icon-btn"
							aria-label={t('Navigation:config-label')}
						>
							<svg viewBox="0 0 448 512" fill="currentColor">
								<path d="M288 0L160 0 128 0C110.3 0 96 14.3 96 32s14.3 32 32 32l0 132.8c0 11.8-3.3 23.5-9.5 33.5L10.3 406.2C3.6 417.2 0 429.7 0 442.6C0 480.9 31.1 512 69.4 512l309.2 0c38.3 0 69.4-31.1 69.4-69.4c0-12.8-3.6-25.4-10.3-36.4L329.5 230.4c-6.2-10.1-9.5-21.7-9.5-33.5L320 64c17.7 0 32-14.3 32-32s-14.3-32-32-32L288 0zM192 196.8L192 64l64 0 0 132.8c0 23.7 6.6 46.9 19 67.1L309.5 320l-171 0L173 263.9c12.4-20.2 19-43.4 19-67.1z"/>
							</svg>
						</Button>
					)}
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
						<svg viewBox="0 0 384 512" fill="currentColor" style={{ marginRight: '0.5rem', height: '1em' }}>
							<path d="M96 0C78.3 0 64 14.3 64 32l0 96 64 0 0-96c0-17.7-14.3-32-32-32zM288 0c-17.7 0-32 14.3-32 32l0 96 64 0 0-96c0-17.7-14.3-32-32-32zM32 160c-17.7 0-32 14.3-32 32s14.3 32 32 32l0 32c0 77.4 55 142 128 156.8l0 67.2c0 17.7 14.3 32 32 32s32-14.3 32-32l0-67.2C297 398 352 333.4 352 256l0-32c17.7 0 32-14.3 32-32s-14.3-32-32-32L32 160z"/>
						</svg>
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
						<svg viewBox="0 0 512 512" fill="currentColor" style={{ marginRight: '0.5rem', height: '1em' }}>
							<path d="M352 256c0 22.2-1.2 43.6-3.3 64l-185.3 0c-2.2-20.4-3.3-41.8-3.3-64s1.2-43.6 3.3-64l185.3 0c2.2 20.4 3.3 41.8 3.3 64zm28.8-64l123.1 0c5.3 20.5 8.1 41.9 8.1 64s-2.8 43.5-8.1 64l-123.1 0c2.1-20.6 3.2-42 3.2-64s-1.1-43.4-3.2-64zm112.6-32l-116.7 0c-10-63.9-29.8-117.4-55.3-151.6c78.3 20.7 142 77.5 171.9 151.6zm-149.1 0l-176.6 0c6.1-36.4 15.5-68.6 27-94.7c10.5-23.6 22.2-40.7 33.5-51.5C239.4 3.2 248.7 0 256 0s16.6 3.2 27.8 13.8c11.3 10.8 23 27.9 33.5 51.5c11.6 26 20.9 58.2 27 94.7zm-209 0L18.6 160C48.6 85.9 112.2 29.1 190.6 8.4C165.1 42.6 145.3 96.1 135.3 160zM8.1 192l123.1 0c-2.1 20.6-3.2 42-3.2 64s1.1 43.4 3.2 64L8.1 320C2.8 299.5 0 278.1 0 256s2.8-43.5 8.1-64zM194.7 446.6c-11.6-26-20.9-58.2-27-94.6l176.6 0c-6.1 36.4-15.5 68.6-27 94.6c-10.5 23.6-22.2 40.7-33.5 51.5C272.6 508.8 263.3 512 256 512s-16.6-3.2-27.8-13.8c-11.3-10.8-23-27.9-33.5-51.5zM135.3 352c10 63.9 29.8 117.4 55.3 151.6C112.2 482.9 48.6 426.1 18.6 352l116.7 0zm358.1 0c-30 74.1-93.6 130.9-171.9 151.6c25.5-34.2 45.2-87.7 55.3-151.6l116.7 0z"/>
						</svg>
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
						<svg viewBox="0 0 640 512" fill="currentColor" style={{ marginRight: '0.5rem', height: '1em' }}>
							<path d="M192 64C86 64 0 150 0 256S86 448 192 448l256 0c106 0 192-86 192-192s-86-192-192-192L192 64zM496 168a40 40 0 1 1 0 80 40 40 0 1 1 0-80zM392 304a40 40 0 1 1 80 0 40 40 0 1 1 -80 0zM168 200c0-13.3 10.7-24 24-24s24 10.7 24 24l0 32 32 0c13.3 0 24 10.7 24 24s-10.7 24-24 24l-32 0 0 32c0 13.3-10.7 24-24 24s-24-10.7-24-24l0-32-32 0c-13.3 0-24-10.7-24-24s10.7-24 24-24l32 0 0-32z"/>
						</svg>
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
