import type { IFuncErrorChanged } from '@/messages/backendToFrontend';

interface State {
  /** Increased on every funcErrorChanged push; components reload their data when it changes. */
  errorsVersion: number;
  lastErrorChanged: IFuncErrorChanged | null;
  /** Increased on every funcErrorCodesChanged push. */
  codesVersion: number;
}

const state: State = {
  errorsVersion: 0,
  lastErrorChanged: null,
  codesVersion: 0,
};

const getters = {
  getErrorsVersion: (state: State) => state.errorsVersion,
  getLastErrorChanged: (state: State) => state.lastErrorChanged,
  getCodesVersion: (state: State) => state.codesVersion,
};

const actions = {};

const mutations = {
  errorChanged: (state: State, payload: IFuncErrorChanged) => {
    state.lastErrorChanged = payload;
    state.errorsVersion++;
  },
  codesChanged: (state: State) => {
    state.codesVersion++;
  },
};

export const objectStore = {
  namespaced: true,
  state,
  getters,
  actions,
  mutations,
};
