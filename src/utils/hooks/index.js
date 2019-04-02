/* @flow */

import type { Collection } from 'immutable';
import type { InputSelector } from 'reselect';

// $FlowFixMe (not possible until we upgrade flow to 0.87)
import { useEffect, useCallback, useMemo, useRef } from 'react';
import { useDispatch, useMappedState } from 'redux-react-hook';

import type { Action } from '~redux';
import type { DataRecordType, RootStateRecord } from '~immutable';
import type { AsyncFunction } from '../../createPromiseListener';

import { isFetchingData, shouldFetchData } from '~immutable/utils';

import promiseListener from '../../createPromiseListener';

type DataFetcher = {|
  select: (
    rootState: RootStateRecord,
    ...selectArgs: any[]
  ) => ?DataRecordType<*>,
  fetch: (...fetchArgs: any[]) => Action<*>,
  ttl?: number,
|};

type DependantSelector = (
  selector: InputSelector<RootStateRecord, *, *>,
  reduxState: RootStateRecord,
  extraArgs?: any[],
) => boolean;

export type Given = (
  potentialSelector: InputSelector<RootStateRecord, *, *>,
  dependantSelector?: DependantSelector,
) => any | boolean;

type DataFetcherOptions = {
  ttl?: number,
};

export const usePrevious = (value: any) => {
  const ref = useRef();
  useEffect(() => {
    ref.current = value;
  });
  return ref.current;
};

const transformFetchedData = (data: DataRecordType<*>) => {
  if (!data) return null;
  return data.record && typeof data.record.toJS == 'function'
    ? data.record.toJS()
    : data.record;
};

const defaultTransform = (obj: Collection<*, *>) =>
  obj && typeof obj.toJS == 'function' ? obj.toJS() : obj;
/*
 * Given a redux selector and optional selector arguments, get the
 * (immutable) redux state and return a mutable version of it.
 */
export const useSelector = (
  select: InputSelector<*, *, *>,
  args: *[] = [],
  transform?: (obj: Collection<*, *>) => any,
) => {
  const mapState = useCallback(state => select(state, ...args), args);
  const data = useMappedState(mapState, [mapState]);
  const transformFn =
    typeof transform == 'function'
      ? transform
      : select.transform || defaultTransform;

  return useMemo(() => transformFn(data), [data, ...args]);
};

/*
 * T: JS type of the fetched and transformed data, e.g. ColonyType
 */
export const useDataFetcher = <T>(
  { fetch, select, ttl = 0 }: DataFetcher,
  selectArgs: any[],
  fetchArgs: any[],
  { ttl: ttlOverride }: DataFetcherOptions = {},
): {|
  data: ?T,
  isFetching: boolean,
  error: ?string,
|} => {
  const dispatch = useDispatch();
  const mapState = useCallback(
    state => select(state, ...selectArgs),
    selectArgs,
  );
  const data = useMappedState(mapState);

  const isFirstMount = useRef(true);

  const shouldFetch = shouldFetchData(
    data,
    ttlOverride || ttl,
    isFirstMount.current,
    fetchArgs,
  );

  useEffect(
    () => {
      isFirstMount.current = false;
      if (shouldFetch) dispatch(fetch(...fetchArgs), fetchArgs);
    },
    [shouldFetch, ...fetchArgs],
  );

  return {
    data: transformFetchedData(data),
    isFetching: isFetchingData(data),
    error: data ? data.error : null,
  };
};

export const useFeatureFlags = (
  potentialSelectorArgs?: any[] = [],
  dependantSelectorArgs?: any[] = [],
) => {
  const mapState = useCallback(
    reduxState => ({
      given: (
        potentialSelector: any,
        dependantSelector?: DependantSelector,
      ) => {
        const potentialSelectorValue =
          typeof potentialSelector == 'function'
            ? potentialSelector(reduxState, ...potentialSelectorArgs)
            : potentialSelector;

        return typeof dependantSelector == 'function'
          ? dependantSelector(
              potentialSelectorValue,
              reduxState,
              ...dependantSelectorArgs,
            )
          : potentialSelectorValue;
      },
    }),
    [...potentialSelectorArgs, ...dependantSelectorArgs],
  );
  return useMappedState(mapState);
};

export const useAsyncFunction = <P, R>({
  start,
  resolve,
  reject,
}: {|
  start: string,
  resolve: string,
  reject: string,
|}): { current: AsyncFunction<P, R> } => {
  const ref = useRef();
  useEffect(
    () => {
      ref.current = promiseListener.createAsyncFunction<P, R>({
        start,
        resolve,
        reject,
      });
      return () => {
        ref.current.unsubscribe();
      };
    },
    [start, resolve, reject],
  );
  return ref;
};
