'use client';

import { useState } from 'react';
import { Layout, Menu, Card } from 'antd';
import {
  DatabaseOutlined,
  SearchOutlined,
  FileTextOutlined,
  AppstoreOutlined,
} from '@ant-design/icons';
import CollectionsPanel from '@/components/CollectionsPanel';
import UpsertPanel from '@/components/UpsertPanel';
import SearchPanel from '@/components/SearchPanel';
import EmbedPanel from '@/components/EmbedPanel';

const { Content, Sider } = Layout;

type MenuKey = 'collections' | 'upsert' | 'search' | 'embed';

export default function Home() {
  const [selectedMenu, setSelectedMenu] = useState<MenuKey>('collections');

  const getTitle = () => {
    switch (selectedMenu) {
      case 'collections':
        return 'Manage Collections';
      case 'upsert':
        return 'Upsert Documents';
      case 'search':
        return 'Search Documents';
      case 'embed':
        return 'Generate Embeddings';
      default:
        return 'Manage Collections';
    }
  };

  const renderContent = () => {
    switch (selectedMenu) {
      case 'collections':
        return <CollectionsPanel />;
      case 'upsert':
        return <UpsertPanel />;
      case 'search':
        return <SearchPanel />;
      case 'embed':
        return <EmbedPanel />;
      default:
        return <CollectionsPanel />;
    }
  };

  return (
    <Layout style={{ minHeight: '100vh', background: '#141519' }}>
      <Sider
        breakpoint="lg"
        collapsedWidth="0"
        width={275}
        style={{
          overflow: 'auto',
          height: '100vh',
          position: 'fixed',
          left: 0,
          top: 0,
          bottom: 0,
          background: '#1a1d23',
        }}
      >
        <div
          style={{
            height: 32,
            margin: 16,
            color: 'white',
            fontSize: 18,
            fontWeight: 'bold',
            textAlign: 'center',
          }}
        >
          RAGBase
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[selectedMenu]}
          onSelect={({ key }) => setSelectedMenu(key as MenuKey)}
          style={{
            background: 'transparent',
          }}
          items={[
            {
              key: 'collections',
              icon: <AppstoreOutlined />,
              label: 'Collections',
            },
            {
              key: 'upsert',
              icon: <FileTextOutlined />,
              label: 'Upsert Documents',
            },
            {
              key: 'search',
              icon: <SearchOutlined />,
              label: 'Search',
            },
            {
              key: 'embed',
              icon: <DatabaseOutlined />,
              label: 'Generate Embeddings',
            },
          ]}
        />
      </Sider>
      <Layout style={{ marginLeft: 275, background: '#141519' }}>
        <Content 
          style={{ 
            padding: '32px 24px',
            display: 'flex',
            justifyContent: 'center',
          }}
        >
          <div style={{ width: '100%', maxWidth: '1400px' }}>
            <Card
              title={getTitle()}
              style={{ width: '100%' }}
              styles={{
                header: { fontSize: 20, fontWeight: 500 },
                body: { padding: 24 },
              }}
            >
              {renderContent()}
            </Card>
          </div>
        </Content>
      </Layout>
    </Layout>
  );
}

