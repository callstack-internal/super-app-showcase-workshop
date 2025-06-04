import React from 'react';

type TestContextType = {
  bears: number;
  increasePopulation: () => void;
  removeAllBears: () => void;
  updateBears: (bears: number) => void;
}

const TestContext = React.createContext<TestContextType>({
  bears: 0,
  increasePopulation: () => {},
  removeAllBears: () => {},
  updateBears: (_: number) => {},
});

export type { TestContextType };
export { TestContext };
