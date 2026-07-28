import React, { useContext, useEffect } from 'react';
import { AppContext } from '../Contexts/AppContext';
import Button from '../components/ui/Button';
import Form from '../components/ui/Form';
import FormCheck from '../components/ui/FormCheck';
import Table from '../components/ui/Table';
import { Formik, useFormikContext, getIn } from 'formik';
import * as yup from 'yup';
import { useTranslation } from 'react-i18next';
import { useToast } from '../Contexts/ToastContext';
import ContextualHelpOverlay from '../components/shared/ContextualHelpOverlay';

import Section from '../components/shared/Section';
import Microchip from '../Icons/Microchip';
import WebApi, { basePeripheralMapping } from '../Services/WebApi';
import { PERIPHERAL_DEVICES } from '../Data/Peripherals';
import boards from '../Data/Boards.json';

let peripheralFieldsSchema = {
	peripheral: yup.object().shape(
		Object.assign(
			{},
			...PERIPHERAL_DEVICES.map((device) => {
				let deviceProps = Object.assign(
					{},
					...device.blocks.map((block) => {
						return {
							[block.label]: yup.object().shape(
								Object.assign(
									{ enabled: yup.boolean().label(`${block.label} Enabled`) },
									//...Array.from(Object.keys(block.pins), (pin) => ({[pin]: yup.number().label(`${pin} Pin`).validatePinWhenValue(`peripheral.${block.label}.enabled`)}) ),
									...Array.from(Object.keys(block.pins), (pin) => ({
										[pin]: yup.number().label(`${pin} Pin`),
									})),
									...Array.from(Object.keys(device.options), (opt) => ({
										[opt]: yup.number().label('${block.label} ${opt} Setting'),
									})),
								),
							),
						};
					}),
				);
				return deviceProps;
			}),
		),
	),
};

const schema = yup.object().shape({
	...peripheralFieldsSchema,
});

const FormContext = () => {
	const { values, setValues } = useFormikContext();
	const { setLoading } = useContext(AppContext);

	useEffect(() => {
		async function fetchData() {
			await WebApi.getGamepadOptions(setLoading);
			const peripheralOptions = await WebApi.getPeripheralOptions(setLoading);

			setValues(peripheralOptions);
		}
		fetchData();
	}, [setValues]);

	useEffect(() => {}, [values, setValues]);

	return null;
};

export default function PeripheralMappingPage() {
	const { usedPins } = useContext(AppContext);
	const { showToast } = useToast();

	const board = boards[import.meta.env.VITE_GP2040_BOARD] || boards.pico;
	let allPins = [
		...Array(board.maxPin + 1).keys(),
	];
	const pinLookup = (pinList) => {
		return pinList && pinList.length > 0 ? pinList : allPins;
	};

	const onSuccess = async (values) => {
		const cleanValues = schema.cast(values);
		console.dir(cleanValues);

		const success = await WebApi.setPeripheralOptions(cleanValues);

		showToast(
			success
				? t('Common:saved-success-message')
				: t('Common:saved-error-message'),
			success ? 'success' : 'error',
		);
	};

	const generatePeripheralDetails = (header, peripheral) => {
		return (
			<div key={`details-${peripheral.value}-${peripheral.label}`}>
				<div key={`details-${peripheral.value}-header`} className="mb-3">
					{header}
				</div>
				{peripheral.pinTable &&
					peripheral.blocks.map((block, i) => {
						let colCount = Math.max.apply(
							null,
							Object.keys(block.pins).map((pin) => block.pins[pin].length),
						);
						return (
							<Table
								key={`details-${i}`}
								className="caption-top"
								striped="columns"
								responsive
								bordered
								hover
								variant="dark"
								size="sm"
							>
								<caption>{block.label.toUpperCase()}</caption>
								<tbody>
									<tr>
										<th scope="row"></th>
										<th colSpan={colCount}>
											{t('PeripheralMapping:pins-label')}
										</th>
									</tr>
									{Object.keys(block.pins).map((pinName) => (
										<tr key={`block-info-${pinName}`}>
											<th scope="row" className="col-2">
												{pinName.toUpperCase()}
											</th>
											{block.pins[pinName].map((pin) => (
												<td key={`block-info-${pinName}-${pin}`}>{pin}</td>
											))}
											{block.pins[pinName].length < colCount ? <td></td> : ''}
										</tr>
									))}
								</tbody>
							</Table>
						);
					})}
			</div>
		);
	};

	const { t } = useTranslation('');

	return (
		<Formik
			onSubmit={onSuccess}
			validationSchema={schema}
			initialValues={basePeripheralMapping}
		>
			{({ errors, handleSubmit, setFieldValue, values }) =>
				console.log('errors', errors) || (
					<div>
						<Form noValidate onSubmit={handleSubmit}>
							<Section
								heading
								icon={<Microchip />}
								title={t('PeripheralMapping:header-text')}
								description={t('PeripheralMapping:sub-header-text')}
							>
								<div className="d-flex flex-column gap-3">
									{PERIPHERAL_DEVICES.map((peripheral, i) => (
										<div
											key={`peripheral-${peripheral.value}`}
											className="d-flex flex-column gap-1"
										>
											<Form.Label>
												<span className="d-flex align-items-center gap-1">
													{t(`PeripheralMapping:${peripheral.label}-label`)}
													<ContextualHelpOverlay
													title={t(
														`PeripheralMapping:${peripheral.label}-desc-header`,
													)}
													body={generatePeripheralDetails(
														t(
															`PeripheralMapping:${peripheral.label}-description`,
														),
														peripheral,
													)}
												></ContextualHelpOverlay>
												</span>
											</Form.Label>
											{peripheral.blocks.map((block, i) => (
												<div
													key={`peripheral${peripheral.value}block${block.value}`}
													className="d-flex align-items-center gap-3 flex-wrap"
												>
													<FormCheck
														key={`peripheral.${block.label}.enabled`}
														name={`peripheral.${block.label}.enabled`}
														label={`${block.label.toUpperCase()}`}
														id={`peripheral.${block.label}.enabled`}
														type="switch"
														reverse={true}
														isInvalid={false}
														value={values.peripheral[`${block.label}`].enabled}
														checked={Boolean(
															values.peripheral[`${block.label}`].enabled,
														)}
														onChange={(e) => {
															setFieldValue(
																`peripheral.${block.label}.enabled`,
																e.target.checked ? 1 : 0,
															);
														}}
													/>
													{Object.keys(block.pins).map((pin, i) => (
														<div
															key={`${block.label}.${pin}`}
															className="d-flex flex-column gap-1"
														>
															<Form.Label>
																{t(
																	`PeripheralMapping:pin-${pin.toLowerCase()}-label`,
																)}
															</Form.Label>
															<Form.Select
																key={`peripheral.${block.label}.${pin}`}
																id={`peripheral.${block.label}.${pin}`}
																name={`peripheral.${block.label}.${pin}`}
																className="form-select-sm"
																disabled={
																	!Boolean(
																		values.peripheral[`${block.label}`].enabled,
																	)
																}
																error={getIn(
																	errors,
																	`peripheral.${block.label}.${pin}`,
																)}
																value={
																	values.peripheral[`${block.label}`][`${pin}`]
																}
																onChange={(e) => {
																	setFieldValue(
																		`peripheral.${block.label}.${pin}`,
																		e.target.value,
																	);
																}}
															>
																<option
																	key={`block-${block.label}-pin-unset`}
																	value="-1"
																>
																	Unset
																</option>
																{pinLookup(block.pins[pin]).map((o, i2) => (
																	<option
																		key={`block-${block.label}-pin-${i2}`}
																		value={o}
																	>
																		{!usedPins.includes(o)
																			? o
																			: `${o} - ${t(
																					'PeripheralMapping:pin-in-use',
																			  )}`}
																	</option>
																))}
															</Form.Select>
														</div>
													))}
													{Object.keys(peripheral.options).map((option, i) => (
														<div
															key={`${block.label}.${option}`}
															className="d-flex flex-column gap-1"
														>
															<Form.Label>
																{t(
																	`PeripheralMapping:option-${option.toLowerCase()}-label`,
																)}
															</Form.Label>
															<Form.Select
																key={`peripheral.${block.label}.${option}`}
																id={`peripheral.${block.label}.${option}`}
																name={`peripheral.${block.label}.${option}`}
																className="form-select-sm"
																disabled={
																	!Boolean(
																		values.peripheral[`${block.label}`].enabled,
																	)
																}
																error={getIn(
																	errors,
																	`peripheral.${block.label}.${option}`,
																)}
																value={
																	values.peripheral[`${block.label}`][`${option}`]
																}
																onChange={(e) => {
																	setFieldValue(
																		`peripheral.${block.label}.${option}`,
																		e.target.value,
																	);
																}}
															>
																{peripheral.options[option].map((o, i2) => (
																	<option
																		key={`block-${block.label}-option-${option}-${o.value}`}
																		value={o.value}
																	>
																		{`${t(
																			`PeripheralMapping:option-${option}-choice-${o.value}-label`,
																		)} - ${o.value}`}
																	</option>
																))}
															</Form.Select>
														</div>
													))}
												</div>
											))}
										</div>
									))}
								</div>
								<div className="d-flex gap-2 align-self-end">
									<Button type="submit">
										{t('Common:button-save-label')}
									</Button>
								</div>
							</Section>
							<FormContext />
						</Form>
					</div>
				)
			}
		</Formik>
	);
}
