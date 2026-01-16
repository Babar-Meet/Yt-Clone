    import React from 'react';
    import { BrowserRouter, Routes, Route } from 'react-router-dom';
    import Layout from './components/Layout/Layout';
    import Home from './components/Home/Home';
    import MyLibrary from './components/MyLibrary/MyLibrary';
    import Downloader from './components/Downloader/Downloader';
    import ManualVideoAdd from './components/ManualVideoAdd/ManualVideoAdd';
    import Watch from './components/Watch/Watch';

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