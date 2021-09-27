
import { Button, Space, Form,Select as DefaultSelect, Table } from 'antd';
import { CustomModal } from 'components/Modal';
import Spinner from 'components/Spinner';
import { SKIP_ONBOARDING } from 'constants/onboarding';
import ROUTES from 'constants/routes';
import React, { useEffect, useState } from 'react';
import { connect } from 'react-redux';
import { NavLink, useLocation } from 'react-router-dom';
import { getCodesCountList,codesCountResponse, GlobalTime, DateTimeRangeType, updateTimeInterval } from 'store/actions';
import { StoreState } from 'store/reducers';
import styled from 'styled-components';

import { LOCAL_STORAGE } from 'constants/localStorage';
import { METRICS_PAGE_QUERY_PARAM } from 'constants/query';
import { cloneDeep } from 'lodash';
import moment from 'moment';``

import {
	DefaultOptionsBasedOnRoute,
	Options,
	ServiceMapOptions,
} from '../Nav/TopNav/config';
import CustomDateTimeModal from '../Nav/TopNav/CustomDateTimeModal';
import { getLocalStorageRouteKey } from '../Nav/TopNav/utils';



const Select = styled(DefaultSelect)``;
interface ServicesTableProps {
	codesCountList: codesCountResponse[];
	getCodesCountList: Function;
	updateTimeInterval: Function;
	globalTime: GlobalTime;
}

const Wrapper = styled.div`
	padding-top: 40px;
	padding-bottom: 40px;
	padding-left: 40px;
	padding-right: 40px;
	.ant-table table {
		font-size: 12px;
	}
	.ant-table tfoot > tr > td,
	.ant-table tfoot > tr > th,
	.ant-table-tbody > tr > td,
	.ant-table-thead > tr > th {
		padding: 10px;
	}
`;

const TableLoadingWrapper = styled.div`
	display: flex;
	justify-content: center;
	margin-top: 80px;
`;

const LoadingText = styled.div`
	margin-left: 16px;
`;

const columns = [
	{
		title: 'Application',
		dataIndex: 'serviceName',
		width: '74%',
		key: 'serviceName',
		render: (text: string) => (
			<NavLink
				style={{ textTransform: 'capitalize' }}
				to={ROUTES.APPLICATION + '/' + text}
			>
				<strong>{text}</strong>
			</NavLink>
		),
	},
	{
		title: 'Errors',
		dataIndex: 'count',
		key: 'count',
		sorter: (a: any, b: any) => a.count - b.count,
		// sortDirections: ['descend', 'ascend'],
		render: (value: number) => value,
	},
];

const _ServicesTable = (props: ServicesTableProps) => {
	const [initialDataFetch, setDataFetched] = useState(false);
	const [errorObject, setErrorObject] = useState({
		message: '',
		isError: false,
	});
	const isEmptyServiceList =
		!initialDataFetch && props.codesCountList.length === 0;
	const isEmptyCodesCountList = 
		!initialDataFetch && props.codesCountList.length === 0;
	const refetchFromBackend = isEmptyCodesCountList || errorObject.isError;
	const [skipOnboarding, setSkipOnboarding] = useState(
		localStorage.getItem(SKIP_ONBOARDING) === 'true',
	);

	const onContinueClick = () => {
		localStorage.setItem(SKIP_ONBOARDING, 'true');
		setSkipOnboarding(true);
	};

	const location = useLocation();
	const LocalStorageRouteKey: string = getLocalStorageRouteKey(
		location.pathname,
	);
	const timeDurationInLocalStorage =
		JSON.parse(localStorage.getItem(LOCAL_STORAGE.METRICS_TIME_IN_DURATION)) ||
		{};
	const options =
		location.pathname === ROUTES.SERVICE_MAP ? ServiceMapOptions : Options;
	let defaultTime = DefaultOptionsBasedOnRoute[LocalStorageRouteKey]
		? DefaultOptionsBasedOnRoute[LocalStorageRouteKey]
		: DefaultOptionsBasedOnRoute.default;
	if (timeDurationInLocalStorage[LocalStorageRouteKey]) {
		defaultTime = timeDurationInLocalStorage[LocalStorageRouteKey];
	}
	const [currentLocalStorageRouteKey, setCurrentLocalStorageRouteKey] = useState(
		LocalStorageRouteKey,
	);
	const [customDTPickerVisible, setCustomDTPickerVisible] = useState(false);
	const [totalErrors, setTotalErrors] = useState(0);
	const [timeInterval, setTimeInterval] = useState(defaultTime);
	const [startTime, setStartTime] = useState<moment.Moment | null>(null);
	const [dateVariable, setDateVariable] = useState(0)
	const eventTypeOptions = [
		{value: 500, label: 'Errors'}
	];
	const [eventTypeValue, setEventTypeValue] = useState(500);
	const [endTime, setEndTime] = useState<moment.Moment | null>(null);
	const [refreshButtonHidden, setRefreshButtonHidden] = useState(false);
	const [form_dtselector] = Form.useForm();

	const updateTimeOnQueryParamChange = () => {
		const urlParams = new URLSearchParams(location.search);
		const intervalInQueryParam = urlParams.get(METRICS_PAGE_QUERY_PARAM.interval);
		const startTimeString = urlParams.get(METRICS_PAGE_QUERY_PARAM.startTime);
		const endTimeString = urlParams.get(METRICS_PAGE_QUERY_PARAM.endTime);

		// first pref: handle both startTime and endTime
		if (
			startTimeString &&
			startTimeString.length > 0 &&
			endTimeString &&
			endTimeString.length > 0
		) {
			const startTime = moment(Number(startTimeString));
			const endTime = moment(Number(endTimeString));
			setCustomTime(startTime, endTime, true);
		} else if (currentLocalStorageRouteKey !== LocalStorageRouteKey) {
			setMetricsTimeInterval(defaultTime);
			setCurrentLocalStorageRouteKey(LocalStorageRouteKey);
		}
		// first pref: handle intervalInQueryParam
		else if (intervalInQueryParam) {
			setMetricsTimeInterval(intervalInQueryParam);
		}
	};

	const setToLocalStorage = (val: string) => {
		let timeDurationInLocalStorageObj = cloneDeep(timeDurationInLocalStorage);
		if (timeDurationInLocalStorageObj) {
			timeDurationInLocalStorageObj[LocalStorageRouteKey] = val;
		} else {
			timeDurationInLocalStorageObj = {
				[LocalStorageRouteKey]: val,
			};
		}
		window.localStorage.setItem(
			LOCAL_STORAGE.METRICS_TIME_IN_DURATION,
			JSON.stringify(timeDurationInLocalStorageObj),
		);
	};


	useEffect(() => {
		setMetricsTimeInterval(defaultTime);
	}, []);

		// On URL Change
	useEffect(() => {
		updateTimeOnQueryParamChange();
	}, [location]);

	const setMetricsTimeInterval = (value: string) => {
		props.updateTimeInterval(value);
		setTimeInterval(value);
		setEndTime(null);
		setStartTime(null);
		setToLocalStorage(value);
	};


	const setCustomTime = (
		startTime: moment.Moment,
		endTime: moment.Moment,
		triggeredByURLChange = false,
	) => {
		props.updateTimeInterval('custom', [startTime.valueOf(), endTime.valueOf()]);
		setEndTime(endTime);
		setStartTime(startTime);
	};

	const updateUrlForTimeInterval = (value: string) => {
		props.history.push({
			search: `?${METRICS_PAGE_QUERY_PARAM.interval}=${value}`,
		}); //pass time in URL query param for all choices except custom in datetime picker
	};

	const updateUrlForCustomTime = (
		startTime: moment.Moment,
		endTime: moment.Moment,
		triggeredByURLChange = false,
	) => {
		props.history.push(
			`?${METRICS_PAGE_QUERY_PARAM.startTime}=${startTime.valueOf()}&${
				METRICS_PAGE_QUERY_PARAM.endTime
			}=${endTime.valueOf()}`,
		);
	};

	const handleOnSelect = (value: string) => {
		if (value === 'custom') {
			setCustomDTPickerVisible(true);
		} else {
			setTimeInterval(value);
			updateUrlForTimeInterval(value);
			setRefreshButtonHidden(false); // for normal intervals, show refresh button
		}
	};

	const handleOnSelectEventType = (value: string) => {
		setEventTypeValue(value);
	};

	const handleCustomDate = (dateTimeRange: DateTimeRangeType) => {
		// pass values in ms [minTime, maxTime]
		if (
			dateTimeRange !== null &&
			dateTimeRange !== undefined &&
			dateTimeRange[0] !== null &&
			dateTimeRange[1] !== null
		) {
			const startTime = dateTimeRange[0].valueOf();
			const endTime = dateTimeRange[1].valueOf();

			updateUrlForCustomTime(moment(startTime), moment(endTime));
			//setting globaltime
			setRefreshButtonHidden(true);
			form_dtselector.setFieldsValue({
				interval:
					dateTimeRange[0].format('YYYY/MM/DD HH:mm') +
					'-' +
					dateTimeRange[1].format('YYYY/MM/DD HH:mm'),
			});
		}
		setCustomDTPickerVisible(false);
	};

	function getApiServiceData() {
		props
			.getCodesCountList(props.globalTime,eventTypeValue)
			.then(() => {
				setDataFetched(true);
				setErrorObject({ message: '', isError: false });
			})
			.catch((e: string) => {
				setErrorObject({ message: e, isError: true });
				setDataFetched(true);
			});
	}
	useEffect(() => {
		if(dateVariable !== props.globalTime){
			setDateVariable(props.globalTime);
		}
	}, [props.globalTime]);
	
	useEffect(getApiServiceData, []);
	
	useEffect(getApiServiceData, [eventTypeValue, dateVariable]);
		useEffect(() => {
			if (props.codesCountList.length > 1) {
				localStorage.removeItem(SKIP_ONBOARDING);
			}
			let totalErrors: number = 0;
			if (props.codesCountList.length > 0) {
				props.codesCountList.map((obj:any) => {
					totalErrors += obj.count ? obj.count :0
				});
			}
			setTotalErrors(totalErrors);
			refetchFromBackend && setTimeout(getApiServiceData, 50000);
		}, [props.codesCountList, errorObject]);
	
	if (!initialDataFetch) {
		return <Spinner height="90vh" size="large" tip="Fetching data..." />;
	}

	if (refetchFromBackend && !skipOnboarding) {
		return (
			<CustomModal
				title={'Setup instrumentation'}
				isModalVisible={true}
				closable={false}
				setIsModalVisible={() => {}}
				footer={[
					<Button key="submit" type="primary" onClick={onContinueClick}>
						Continue without instrumentation
					</Button>,
				]}
			>
				<div>
					<iframe
						width="100%"
						height="265"
						src="https://www.youtube.com/embed/Ly34WBQ2640"
						frameBorder="0"
						allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
						allowFullScreen
					></iframe>
					<div style={{ margin: '20px 0' }}>
						<Spinner />
					</div>
					<div>
						No instrumentation data.
						<br />
						Please instrument your application as mentioned{' '}
						<a
							href={'https://signoz.io/docs/instrumentation/overview'}
							target={'_blank'}
							rel="noreferrer"
						>
							here
						</a>
					</div>
				</div>
			</CustomModal>
		);
	}

	// if (props.location.pathname.startsWith(ROUTES.USAGE_EXPLORER)) {
	// 	return null;
	// } else {
	// 	const inputLabeLToShow =
	// 		startTime && endTime
	// 			? `${startTime.format('YYYY/MM/DD HH:mm')} - ${endTime.format(
	// 				'YYYY/MM/DD HH:mm',
	// 			  )}`
	// 			: timeInterval;
	const inputLabeLToShow =
			startTime && endTime
				? `${startTime.format('YYYY/MM/DD HH:mm')} - ${endTime.format(
					'YYYY/MM/DD HH:mm',
				  )}`
				: timeInterval;

	return (
		<Wrapper>
			<div className="container" style={{marginLeft: "1px", marginRight: "0px"}}>
				<div className="row mb-4">
					<div className="col-9" style={{paddingLeft: "0px", paddingRight: "0px"}}>
						<div style={{width: "100%"}}>
						<Form
							form={form_dtselector}
							layout="inline"
							initialValues={{ interval: '15min' }}
							style={{ marginTop: 10, marginBottom: 10 }}
						>
							<Select style={{width: "100%"}} onSelect={handleOnSelect} value={inputLabeLToShow}>
								{options.map(({ value, label }) => (
									<Option value={value}>{label}</Option>
								))}
							</Select>
						</Form>
							<CustomDateTimeModal
								visible={customDTPickerVisible}
								onCreate={handleCustomDate}
								onCancel={() => {
									setCustomDTPickerVisible(false);
								}}
							/>
						</div>
					</div>
					<div className="col-3">
						<Select style={{width: "100%", marginTop:"10px"}} onSelect={handleOnSelectEventType} value={eventTypeValue} >
							{eventTypeOptions.map(({ value, label }) => (
								<Option value={value}>{label}</Option>
							))}
						</Select>
					</div>
				</div>
			</div>
			<div className="container mb-4" style={{marginBottom: "17px", marginLeft: "1px"}}>
				<div className="row">
					<div className="ant-table" style={{fontFamily: "Rubik,Avenir Next,Helvetica Neue,sans-serif",
						fontSize: "16px", boxSizing: "border-box", borderRadius: "4px", width: "26%",
						display: "flex", flexDirection: "column",
						justifyContent: "space-between",
						padding: "16px 20px",
						minHeight: "96px"}}>
						<div>
							<div style={{display: "block", width: "100%"}}>
								<span>
									<span>Total Errors</span>
								</span>
							</div>
						</div>
						<div>
							<span>{totalErrors?totalErrors:0}</span>
						</div>
    				</div>
				</div>
			</div>
			<Table
				dataSource={props.codesCountList && props.codesCountList.length? props.codesCountList:[]}
				columns={columns}
				pagination={false}
			/>

			{props.codesCountList[0] !== undefined &&
				props.codesCountList[0].count === 0 && (
				<Space
					style={{ width: '100%', margin: '40px 0', justifyContent: 'center' }}
				>
						No applications present. Please add instrumentation (follow this
					<a
						href={'https://signoz.io/docs/instrumentation/overview'}
						target={'_blank'}
						style={{ marginLeft: 3 }}
						rel="noreferrer"
					>
							guide
					</a>
						)
				</Space>
			)}
		</Wrapper>
	);
};

const mapStateToProps = (
	state: StoreState,
): { codesCountList: codesCountResponse[]; globalTime: GlobalTime } => {
	return {
		codesCountList: state.codesCountList,
		globalTime: state.globalTime,
	};
};

export const ServicesTable = connect(mapStateToProps, {
	getCodesCountList: getCodesCountList,
	updateTimeInterval: updateTimeInterval,
})(_ServicesTable);
