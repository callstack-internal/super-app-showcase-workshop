import React from 'react';
import TestContext from '../contexts/TestContext';

enum ActionTypes {
  INCREASE = 'INCREASE',
  REMOVE_ALL = 'REMOVE_ALL',
  UPDATE = 'UPDATE',
}

type Action =
  | {type: ActionTypes.INCREASE}
  | {type: ActionTypes.REMOVE_ALL}
  | {type: ActionTypes.UPDATE; payload: number};

type State = {
  bears: number;
};

const reducer = (prevState: State, action: Action): State => {
  switch (action.type) {
    case ActionTypes.INCREASE:
      return {...prevState, bears: prevState.bears + 1};
    case ActionTypes.REMOVE_ALL:
      return {...prevState, bears: 0};
    case ActionTypes.UPDATE:
      return {...prevState, bears: action.payload};
    default:
      return prevState;
  }
};

const TestProvider = ({
  children,
}: {
  children: (sharedData: {
    bears: number;
    increasePopulation: () => void;
    removeAllBears: () => void;
    updateBears: (newBears: number) => void;
  }) => React.ReactNode;
}) => {
  const [state, dispatch] = React.useReducer(reducer, {bears: 0});

  const sharedData = React.useMemo(
    () => ({
      bears: state.bears,
      increasePopulation: () => dispatch({type: ActionTypes.INCREASE}),
      removeAllBears: () => dispatch({type: ActionTypes.REMOVE_ALL}),
      updateBears: (newBears: number) =>
        dispatch({type: ActionTypes.UPDATE, payload: newBears}),
    }),
    [state.bears],
  );

  return (
    <TestContext.Provider value={sharedData}>
      {children(sharedData)}
    </TestContext.Provider>
  );
};

export default TestProvider;
