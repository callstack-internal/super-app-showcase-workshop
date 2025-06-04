import {create, StoreApi} from 'zustand';

type TestStoreType = {
  bears: number;
  increasePopulation: () => void;
  removeAllBears: () => void;
  updateBears: (newBears: number) => void;
};

const TestStore = create<TestStoreType>(
  (set: StoreApi<TestStoreType>['setState']) => ({
    bears: 0,
    increasePopulation: () =>
      set((state: TestStoreType) => ({
        bears: state.bears + 1,
      })),
    removeAllBears: () => set({bears: 0}),
    updateBears: (newBears: number) => set({bears: newBears}),
  }),
);

export {TestStore};
