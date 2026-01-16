import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout/Layout';
import Home from './pages/Home';
import MyLibrary from './pages/MyLibrary';
import Downloader from './pages/Downloader';
import ManualVideoAdd from './pages/ManualVideoAdd';
import Watch from './pages/Watch';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="my-library" element={<MyLibrary />} />
          <Route path="downloader" element={<Downloader />} />
          <Route path="add-video" element={<ManualVideoAdd />} />
          <Route path="watch/:videoId" element={<Watch />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;