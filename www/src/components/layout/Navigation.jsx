import React, { useState } from 'react';
import Nav from '../ui/Nav';
import Navbar from '../ui/Navbar';
import Button from '../ui/Button';
import Modal from '../ui/Modal';
import { useTranslation } from 'react-i18next';
import { NavLink, useLocation } from 'react-router-dom';
import Flask from '../../Icons/Flask';
import Gamepad from '../../Icons/Gamepad';
import Gear from '../../Icons/Gear';
import Reboot from '../../Icons/Reboot';
import WebApi from '../../Services/WebApi';
import useSystemStats from '../../Store/useSystemStats';

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
				<Navbar.Brand title={`GP2040-th ${t('Navigation:home-label')}`}>
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
				<Nav className="navbar-actions" activeKey={location.pathname}>
					<Nav.Link as={NavLink} to="/layout" eventKey="/layout" className="nav-btn">
						<span style={{ display: 'inline-flex', alignItems: 'center' }}>
							<Gamepad style={{ marginRight: '0.5rem' }} />
							{t('Navigation:layout-label')}
						</span>
					</Nav.Link>
					<Nav.Link as={NavLink} to="/settings" eventKey="/settings" className="nav-btn">
						<span style={{ display: 'inline-flex', alignItems: 'center' }}>
							<Gear style={{ marginRight: '0.5rem' }} />
							{t('Navigation:settings-label')}
						</span>
					</Nav.Link>
					{showConfigButton && (
						<Nav.Link
							as={NavLink}
							to="/configuration"
							eventKey="/configuration"
							className="nav-btn"
							aria-label={t('Navigation:config-label')}
						>
							<span style={{ display: 'inline-flex', alignItems: 'center' }}>
								<Flask style={{ marginRight: '0.5rem' }} />
								{t('Navigation:config-label')}
							</span>
						</Nav.Link>
					)}
					<Button variant="success" onClick={handleShow} aria-label={t('Navigation:reboot-label')} className="icon-btn">
						<Reboot />
						<span className="btn-text"> {t('Navigation:reboot-label')}</span>
					</Button>
				</Nav>
			</Navbar.Collapse>

			<Modal show={show} onHide={handleClose}>
				<div className="reboot-modal-body">
					<div className="d-flex align-items-center justify-content-between">
						<div className="d-flex align-items-center gap-2 fw-semibold reboot-modal-heading">
							<Reboot />
							{t('Navigation:reboot-modal-label')}
						</div>
						<button type="button" className="btn-close" onClick={handleClose}>&times;</button>
					</div>
					<Button
						variant="secondary"
						onClick={() => handleReboot(BOOT_MODES.BOOTSEL)}
						className="justify-content-start gap-3"
					>
						<span className="reboot-modal-icon">
							<svg viewBox="0 0 384 512" fill="currentColor">
								<path d="M96 0C78.3 0 64 14.3 64 32l0 96 64 0 0-96c0-17.7-14.3-32-32-32zM288 0c-17.7 0-32 14.3-32 32l0 96 64 0 0-96c0-17.7-14.3-32-32-32zM32 160c-17.7 0-32 14.3-32 32s14.3 32 32 32l0 32c0 77.4 55 142 128 156.8l0 67.2c0 17.7 14.3 32 32 32s32-14.3 32-32l0-67.2C297 398 352 333.4 352 256l0-32c17.7 0 32-14.3 32-32s-14.3-32-32-32L32 160z"/>
							</svg>
						</span>
						<span className="reboot-modal-label">{t('Navigation:reboot-modal-button-bootsel-label')}</span>
					</Button>
					<Button
						variant="primary"
						onClick={() => handleReboot(BOOT_MODES.WEBCONFIG)}
						className="justify-content-start gap-3"
					>
						<span className="reboot-modal-icon">
							<svg viewBox="0 0 512 512" fill="currentColor">
								<path d="M352 256c0 22.2-1.2 43.6-3.3 64l-185.3 0c-2.2-20.4-3.3-41.8-3.3-64s1.2-43.6 3.3-64l185.3 0c2.2 20.4 3.3 41.8 3.3 64zm28.8-64l123.1 0c5.3 20.5 8.1 41.9 8.1 64s-2.8 43.5-8.1 64l-123.1 0c2.1-20.6 3.2-42 3.2-64s-1.1-43.4-3.2-64zm112.6-32l-116.7 0c-10-63.9-29.8-117.4-55.3-151.6c78.3 20.7 142 77.5 171.9 151.6zm-149.1 0l-176.6 0c6.1-36.4 15.5-68.6 27-94.7c10.5-23.6 22.2-40.7 33.5-51.5C239.4 3.2 248.7 0 256 0s16.6 3.2 27.8 13.8c11.3 10.8 23 27.9 33.5 51.5c11.6 26 20.9 58.2 27 94.7zm-209 0L18.6 160C48.6 85.9 112.2 29.1 190.6 8.4C165.1 42.6 145.3 96.1 135.3 160zM8.1 192l123.1 0c-2.1 20.6-3.2 42-3.2 64s1.1 43.4 3.2 64L8.1 320C2.8 299.5 0 278.1 0 256s2.8-43.5 8.1-64zM194.7 446.6c-11.6-26-20.9-58.2-27-94.6l176.6 0c-6.1 36.4-15.5 68.6-27 94.6c-10.5 23.6-22.2 40.7-33.5 51.5C272.6 508.8 263.3 512 256 512s-16.6-3.2-27.8-13.8c-11.3-10.8-23-27.9-33.5-51.5zM135.3 352c10 63.9 29.8 117.4 55.3 151.6C112.2 482.9 48.6 426.1 18.6 352l116.7 0zm358.1 0c-30 74.1-93.6 130.9-171.9 151.6c25.5-34.2 45.2-87.7 55.3-151.6l116.7 0z"/>
							</svg>
						</span>
						<span className="reboot-modal-label">{t('Navigation:reboot-modal-button-web-config-label')}</span>
					</Button>
					<Button
						variant="success"
						onClick={() => handleReboot(BOOT_MODES.GAMEPAD)}
						className="justify-content-start gap-3"
					>
						<span className="reboot-modal-icon">
							<svg viewBox="0 0 640 512" fill="currentColor">
								<path d="M192 64C86 64 0 150 0 256S86 448 192 448l256 0c106 0 192-86 192-192s-86-192-192-192L192 64zM496 168a40 40 0 1 1 0 80 40 40 0 1 1 0-80zM392 304a40 40 0 1 1 80 0 40 40 0 1 1 -80 0zM168 200c0-13.3 10.7-24 24-24s24 10.7 24 24l0 32 32 0c13.3 0 24 10.7 24 24s-10.7 24-24 24l-32 0 0 32c0 13.3-10.7 24-24 24s-24-10.7-24-24l0-32-32 0c-13.3 0-24-10.7-24-24s10.7-24 24-24l32 0 0-32z"/>
							</svg>
						</span>
						<span className="reboot-modal-label">{t('Navigation:reboot-modal-button-controller-label')}</span>
					</Button>
				</div>
			</Modal>
		</Navbar>
	);
};

export default Navigation;
