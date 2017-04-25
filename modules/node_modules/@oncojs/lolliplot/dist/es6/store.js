import { createStore } from 'redux';
import { handleActions } from 'redux-actions';

var createStoreWrapper = function createStoreWrapper(_ref) {
  var domainWidth = _ref.domainWidth;

  var initialState = {
    animating: false,
    min: 0,
    max: domainWidth,
    startMin: 0,
    startMax: domainWidth,
    targetMin: 0,
    targetMax: domainWidth,
    domain: domainWidth,
    currentAnimationIteration: 0,
    consequenceFilters: [],
    impactFilters: [],
    dragging: false,
    zoomStart: null,
    sliding: false,
    slideStart: null,
    slideStartMin: null,
    slideStartMax: null,
    type: 'Consequence'
  };

  var reducer = handleActions({
    UPDATE: function UPDATE(state, action) {
      return Object.assign({}, state, action.payload);
    }
  }, initialState);

  var store = createStore(reducer);
  store.update = function (payload) {
    return store.dispatch({ type: 'UPDATE', payload: payload });
  };

  return store;
};

export default createStoreWrapper;