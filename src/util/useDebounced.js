// Thanks to https://stackoverflow.com/a/59184678
import React, { useCallback } from 'react';
import debounce from 'lodash.debounce';

const useDebounced = (callback, delay, opts) => {
  const ref = React.createRef();
  ref.current = callback;
  return useCallback(debounce(
    (...args) => ref.current(...args),
    delay,
    opts
  ), []);
};

export default useDebounced;
