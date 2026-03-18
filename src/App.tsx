/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Home from './pages/Home';
import Search from './pages/Search';
import Favorites from './pages/Favorites';
import MangaDetails from './pages/MangaDetails';
import Reader from './pages/Reader';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="search" element={<Search />} />
          <Route path="favorites" element={<Favorites />} />
          <Route path="manga/:id" element={<MangaDetails />} />
        </Route>
        <Route path="/read/:mangaId/:chapterId" element={<Reader />} />
      </Routes>
    </BrowserRouter>
  );
}
