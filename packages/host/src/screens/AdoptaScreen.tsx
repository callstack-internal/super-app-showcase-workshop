import React from 'react';
import ErrorBoundary from '../components/ErrorBoundary';
import Placeholder from '../components/Placeholder';

const AdoptaApp = React.lazy(() => import('adoptaApp/App'));

const AdoptaScreen = () => {
  return (
    <ErrorBoundary name="AdoptaScreen">
      <React.Suspense fallback={<Placeholder label="Adopta" icon="dog" />}>
        <AdoptaApp />
      </React.Suspense>
    </ErrorBoundary>
  );
};

export default AdoptaScreen;
