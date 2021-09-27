import api, { apiV1 } from 'api';
import { Dispatch } from 'redux';

import { GlobalTime } from './global';
import { ActionTypes } from './types';

// PNOTE
// define stats interface - what it should return
// define action creator to show list of stats on component mount -- use useEffect ( , []) -> Mounts when loaded first time
// Date() - takes number of milliseconds as input, our API takes in microseconds
// Sample API call for stats - https://api.signoz.io/api/statss?end=1606968273667000&limit=20&lookback=2d&maxDuration=&minDuration=&service=driver&operation=&start=1606968100867000
// Sample API call for stats - http://localhost:3000/api/v1/codesCountPerApplication?start=1632044067915000000&end=1632648867915000000&eventType=500


export interface codesCountResponse {
    serviceName: string;
	count: number;
}

export interface CodesCountListAction {
	type: ActionTypes.codesCountList;
	payload: codesCountResponse[];
}


export const getCodesCountList = (globalTime: GlobalTime,eventValue: number) => {
	return async (dispatch: Dispatch) => {
		const request_string =
			'/codesCountPerApplication?start=' + globalTime.minTime + '&end=' + globalTime.maxTime + '&eventType=' + eventValue;

		const response = await api.get<codesCountResponse[]>(apiV1 + request_string);

		dispatch<CodesCountListAction>({
			type: ActionTypes.codesCountList,
			payload: response.data,
			//PNOTE - response.data in the axios response has the actual API response
		});
	};
};
