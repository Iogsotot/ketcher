/****************************************************************************
 * Copyright 2021 EPAM Systems
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 ***************************************************************************/

import { put, takeEvery, call } from 'redux-saga/effects';
import { editorSlice, init, initFailure, initSuccess } from 'state/common';

const FETCH_DATA = 'editor/fetchData';

const fetchDataCall = () =>
  new Promise((resolve) => {
    setTimeout(() => resolve('some data'), 1000);
  });

function* fetchData() {
  yield put(init(editorSlice));
  try {
    yield call(fetchDataCall);
    yield put(initSuccess(editorSlice));
  } catch (e) {
    yield put(initFailure(editorSlice));
  }
}

export function* watchFetchData() {
  yield takeEvery(FETCH_DATA, fetchData);
}

export const fetchInitData = () => ({
  type: FETCH_DATA,
});
