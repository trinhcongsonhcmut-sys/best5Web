import { Suspense, lazy, useEffect } from 'react';
import { Route, Routes, useLocation } from 'react-router-dom';
import Home from './home/Home';

// Each demo is its own lazy chunk → three.js scenes (and their fonts) only load on their own route.
const Beauty = lazy(() => import('./demos/beauty'));
const Fnb = lazy(() => import('./demos/fnb'));
const RealEstate = lazy(() => import('./demos/real-estate'));
const Fashion = lazy(() => import('./demos/fashion'));
const Automotive = lazy(() => import('./demos/automotive'));

function ScrollTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

export default function App() {
  return (
    <>
      <ScrollTop />
      <Suspense fallback={<div style={{ minHeight: '100vh', background: '#0b0b0d' }} />}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/beauty" element={<Beauty />} />
          <Route path="/fnb" element={<Fnb />} />
          <Route path="/real-estate" element={<RealEstate />} />
          <Route path="/fashion" element={<Fashion />} />
          <Route path="/automotive" element={<Automotive />} />
          <Route path="*" element={<Home />} />
        </Routes>
      </Suspense>
    </>
  );
}
