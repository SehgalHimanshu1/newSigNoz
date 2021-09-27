import {
	codesCountResponse,
    ActionTypes,
    Action
} from 'store/actions';


type ActionType = {
	type: string;
	payload: any;
};

export const statsReducer = (
	state: codesCountResponse[] = [{serviceName: '',
    count: 0}],
	action: Action,
) => {
	switch (action.type) {

	case ActionTypes.codesCountList:
		return action.payload;
	default:
		return {
			state,
		};
	}
};
