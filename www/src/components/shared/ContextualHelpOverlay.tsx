import React, { useState } from 'react';
import Button from '../ui/Button';
import Offcanvas from '../ui/Offcanvas';

import InfoCircle from '../../Icons/InfoCircle';

const ContextualHelpOverlay = ({ ...props }) => {
	const [show, setShow] = useState(false);

	const handleClose = () => setShow(false);
	const handleShow = () => setShow(true);

	return (
		<>
			<Button
				type="button"
				variant="link"
				onClick={handleShow}
				className="p-0 text-decoration-none"
				style={{ color: 'inherit' }}
			>
				<InfoCircle />
			</Button>
			<Offcanvas show={show} onHide={handleClose} {...props}>
				<Offcanvas.Header closeButton>
					<Offcanvas.Title>{props.title}</Offcanvas.Title>
				</Offcanvas.Header>
				<Offcanvas.Body>{props.body}</Offcanvas.Body>
			</Offcanvas>
		</>
	);
};

export default ContextualHelpOverlay;
