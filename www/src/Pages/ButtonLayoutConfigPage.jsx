import React, { useContext, useEffect, useState } from 'react';
import Button from 'react-bootstrap/Button';
import Row from 'react-bootstrap/Row';
import Form from 'react-bootstrap/Form';

import { Formik, useFormikContext } from 'formik';
import * as yup from 'yup';
import { useTranslation } from 'react-i18next';

import { AppContext } from '../Contexts/AppContext';
import FormSelect from '../Components/FormSelect';
import Section from '../Components/Section';
import WebApi from '../Services/WebApi';

const LAYOUT_ORIENTATION = [
	{ label: 'Standard', value: 0 },
	{ label: 'Southpaw', value: 1 },
	{ label: 'Switched', value: 2 },
];

const defaultValue = {
	buttonLayout: 0,
	buttonLayoutRight: 0,
	buttonLayoutOrientation: 0,
};

const schema = yup.object().shape({
	buttonLayout: yup.number().required().label('Button Layout'),
	buttonLayoutRight: yup.number().required().label('Button Layout Right'),
	buttonLayoutOrientation: yup.number().required().label('Orientation'),
});

let buttonLayoutDefs = { buttonLayout: {}, buttonLayoutRight: {} };

const FormContext = ({ setButtonLayoutDefs }) => {
	const { setValues } = useFormikContext();
	const { setLoading } = useContext(AppContext);

	useEffect(() => {
		async function fetchData() {
			const data = await WebApi.getButtonLayout();
			const defs = await WebApi.getButtonLayoutDefs();
			buttonLayoutDefs = defs;
			setButtonLayoutDefs(defs);
			setValues(data);
		}

		fetchData();
	}, []);

	return null;
};

export default function ButtonLayoutConfigPage() {
	const { t } = useTranslation('');
	const { updateUsedPins } = useContext(AppContext);
	const [saveMessage, setSaveMessage] = useState('');
	const [layoutDefs, setButtonLayoutDefs] = useState({
		buttonLayout: {},
		buttonLayoutRight: {},
	});

	const onSuccess = async (values) => {
		const data = {
			buttonLayout: parseInt(values.buttonLayout),
			buttonLayoutRight: parseInt(values.buttonLayoutRight),
			buttonLayoutOrientation: parseInt(values.buttonLayoutOrientation),
		};

		const success = await WebApi.setButtonLayout(data);
		if (success) updateUsedPins();

		setSaveMessage(
			success
				? t('Common:saved-success-message')
				: t('Common:saved-error-message'),
		);
	};

	const onSubmit = (e, handleSubmit) => {
		e.preventDefault();
		setSaveMessage('');
		handleSubmit();
	};

	return (
		<Formik
			validationSchema={schema}
			onSubmit={onSuccess}
			initialValues={defaultValue}
		>
			{({
				handleSubmit,
				handleChange,
				values,
				errors,
				setFieldValue,
			}) => (
				<Form noValidate onSubmit={(e) => onSubmit(e, handleSubmit)}>
					<Section title={t('LayoutConfig:header-text')}>
						<Row>
							<FormSelect
								label={t('DisplayConfig:form.button-layout-label')}
								name="buttonLayout"
								className="form-select-sm"
								groupClassName="col-sm-4"
								value={values.buttonLayout}
								error={errors.buttonLayout}
								isInvalid={errors.buttonLayout}
								onChange={(e) =>
									setFieldValue('buttonLayout', parseInt(e.target.value))
								}
							>
								{Object.keys(layoutDefs.buttonLayout).map((o, i) => (
									<option
										key={`buttonLayout-option-${i}`}
										value={layoutDefs.buttonLayout[o]}
									>
										{t(`LayoutConfig:layouts.left.${o}`)}
									</option>
								))}
							</FormSelect>
							<FormSelect
								label={t('DisplayConfig:form.button-layout-right-label')}
								name="buttonLayoutRight"
								className="form-select-sm"
								groupClassName="col-sm-4"
								value={values.buttonLayoutRight}
								error={errors.buttonLayoutRight}
								isInvalid={errors.buttonLayoutRight}
								onChange={(e) =>
									setFieldValue(
										'buttonLayoutRight',
										parseInt(e.target.value),
									)
								}
							>
								{Object.keys(layoutDefs.buttonLayoutRight).map((o, i) => (
									<option
										key={`buttonLayoutRight-option-${i}`}
										value={layoutDefs.buttonLayoutRight[o]}
									>
										{t(`LayoutConfig:layouts.right.${o}`)}
									</option>
								))}
							</FormSelect>
							<FormSelect
								label={t('DisplayConfig:form.button-layout-orientation')}
								name="buttonLayoutOrientation"
								className="form-select-sm"
								groupClassName="col-sm-4"
								value={values.buttonLayoutOrientation}
								error={errors.buttonLayoutOrientation}
								isInvalid={errors.buttonLayoutOrientation}
								onChange={(e) =>
									setFieldValue(
										'buttonLayoutOrientation',
										parseInt(e.target.value),
									)
								}
							>
								{LAYOUT_ORIENTATION.map((o, i) => (
									<option key={`orientation-option-${i}`} value={o.value}>
										{o.label}
									</option>
								))}
							</FormSelect>
						</Row>
					</Section>
					<div className="d-flex align-items-center gap-2">
						{saveMessage ? <span className="alert alert-success mb-0 py-1">{saveMessage}</span> : null}
						<Button type="submit">{t('Common:button-save-label')}</Button>
					</div>
					<FormContext setButtonLayoutDefs={setButtonLayoutDefs} />
				</Form>
			)}
		</Formik>
	);
}
