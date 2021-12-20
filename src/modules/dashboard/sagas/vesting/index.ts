import { all, call } from 'redux-saga/effects';

import claimAllocationSaga from './claimAllocation';
import unwrapTokenSaga from './unwrapToken';

export default function* actionsSagas() {
  yield all([call(claimAllocationSaga)]);
  yield all([call(unwrapTokenSaga)]);
}
