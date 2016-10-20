import { createStore } from 'redux'
import { handleActions } from 'redux-actions'

export default ({ domainWidth }) => {
  let initialState = {
    animating: false,
    min: 0,
    max: domainWidth,
    startMin: 0,
    startMax: domainWidth,
    targetMin: 0,
    targetMax: domainWidth,
    domain: domainWidth,
    currentAnimationIteration: 0,
  }

  let reducer = handleActions({
    UPDATE: (state, action) => ({ ...state, ...action.payload }),
  }, initialState)

  let store = createStore(reducer)
  store.update = payload => store.dispatch({ type: `UPDATE`, payload })

  return store
}
