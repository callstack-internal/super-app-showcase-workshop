import React from 'react';

const TestContext = React.createContext({
  bears: 0,
  increasePopulation: () => {},
  removeAllBears: () => {},
  updateBears: (_: number) => {},
});


export default TestContext;
