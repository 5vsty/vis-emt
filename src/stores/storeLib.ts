import { store } from '@fsdev/pluginapi';
import { computed, type ComputedRef } from 'vue';

function mapState<State extends { [key: string]: ComputedRef<unknown> }>(module: string | undefined) {
  return Object.fromEntries(Object.keys(module !== undefined ? store.state[module] : store.state).map((key) => (module !== undefined ? [key, computed(() => store.state[module][key])] : [key, computed(() => store.state[key])]))) as State;
}

function mapGetters<Getters extends { [key: string]: ComputedRef<unknown> }>(module: string | undefined) {
  return Object.fromEntries(
    Object.keys(store.getters).map((getter) => (module !== undefined && getter.startsWith(module) ? [getter.substring(module.length + 1), computed(() => store.getters[getter])] : [getter, computed(() => store.getters[getter])])),
  ) as Getters;
}

function mapMutations<Mutations extends { [k: string]: (...args: never[]) => unknown }>(module: string | undefined) {
  return Object.fromEntries(
    Object.keys(store._mutations).map((mutation) =>
      module !== undefined && mutation.startsWith(module) ? [mutation.substring(module.length + 1), (value: never) => store.commit(mutation, value)] : [mutation, (value: never) => store.commit(mutation, value)],
    ),
  ) as Mutations;
}

function mapActions<Actions extends { [k: string]: (...args: never[]) => unknown }>(module: string | undefined) {
  return Object.fromEntries(
    Object.keys(store._actions).map((action) => (module !== undefined && action.startsWith(module) ? [action.substring(module.length + 1), (value: never) => store.dispatch(action, value)] : [action, (value: never) => store.dispatch(action, value)])),
  ) as Actions;
}

export { mapState, mapGetters, mapMutations, mapActions };
