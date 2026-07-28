import React, { useContext, useEffect, useState } from 'react';
import Button from '../components/ui/Button';
import Form from '../components/ui/Form';

import { Formik, useFormikContext } from 'formik';
import * as yup from 'yup';
import { useTranslation } from 'react-i18next';
import { useToast } from '../Contexts/ToastContext';

import { AppContext } from '../Contexts/AppContext';
import Section from '../components/shared/Section';
import LayerStack from '../Icons/LayerStack';
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
	const { showToast } = useToast();
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

		showToast(
			success
				? t('Common:saved-success-message')
				: t('Common:saved-error-message'),
			success ? 'success' : 'error',
		);
	};

	return (
		<Formik
			validationSchema={schema}
			onSubmit={onSuccess}
			initialValues={defaultValue}
		>
			{({
				handleSubmit,
				values,
				errors,
				setFieldValue,
			}) => (
				<Form noValidate onSubmit={handleSubmit}>
					<Section
						heading
						icon={<LayerStack />}
						title={t('LayoutConfig:header-text')}
					>
						<div className="d-flex flex-column gap-1">
							<Form.Label>
								{t('DisplayConfig:form.button-layout-label')}
							</Form.Label>
							<Form.Select
								name="buttonLayout"
								className="form-select-sm"
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
							</Form.Select>
							<Form.Label>
								{t('DisplayConfig:form.button-layout-right-label')}
							</Form.Label>
							<Form.Select
								name="buttonLayoutRight"
								className="form-select-sm"
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
							</Form.Select>
							<Form.Label>
								{t('DisplayConfig:form.button-layout-orientation')}
							</Form.Label>
							<Form.Select
								name="buttonLayoutOrientation"
								className="form-select-sm"
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
							</Form.Select>
						</div>
						<div className="d-flex gap-2 align-self-end">
							<Button type="submit">
								{t('Common:button-save-label')}
							</Button>
						</div>
					</Section>
					<FormContext setButtonLayoutDefs={setButtonLayoutDefs} />
				</Form>
			)}
		</Formik>
	);
}
