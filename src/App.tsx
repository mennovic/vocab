import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Layout } from '@/components/Layout';
import { Home } from '@/pages/Home';
import { Lists } from '@/pages/Lists';
import { ListDetail } from '@/pages/ListDetail';
import { NewList } from '@/pages/NewList';
import { Scan } from '@/pages/Scan';
import { Practice } from '@/pages/Practice';
import { Stats } from '@/pages/Stats';
import { Settings } from '@/pages/Settings';

export default function App() {
  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/lists" element={<Lists />} />
          <Route path="/lists/new" element={<NewList />} />
          <Route path="/lists/:id" element={<ListDetail />} />
          <Route path="/scan" element={<Scan />} />
          <Route path="/practice" element={<Practice />} />
          <Route path="/practice/:listId" element={<Practice />} />
          <Route path="/stats" element={<Stats />} />
          <Route path="/settings" element={<Settings />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}
