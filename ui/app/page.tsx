'use client';

import { useState, useEffect } from 'react';
import { Layout, Card, Typography, Empty, Button, Modal, Space, Tag, Descriptions, Statistic, Row, Col, Spin, message } from 'antd';
import { DatabaseOutlined, InfoCircleOutlined } from '@ant-design/icons';
import CollectionsSidebar from '@/components/CollectionsSidebar';
import CollectionView from '@/components/CollectionView';
import { getCollectionInfo, type CollectionInfo } from '@/lib/api';

const { Content, Sider } = Layout;
const { Title, Text } = Typography;

export default function Home() {
  const [selectedCollection, setSelectedCollection] = useState<string | null>(null);
  const [infoModalOpen, setInfoModalOpen] = useState(false);
  const [collectionInfo, setCollectionInfo] = useState<CollectionInfo | null>(null);
  const [infoLoading, setInfoLoading] = useState(false);

  const fetchCollectionInfo = async () => {
    if (!selectedCollection) return;
    
    setInfoLoading(true);
    try {
      const info = await getCollectionInfo(selectedCollection, 0, 0);
      setCollectionInfo(info);
    } catch (error) {
      message.error(`Failed to fetch collection info: ${error}`);
    } finally {
      setInfoLoading(false);
    }
  };

  const handleShowInfo = () => {
    setInfoModalOpen(true);
    fetchCollectionInfo();
  };

  // Fetch collection info when collection changes
  useEffect(() => {
    if (selectedCollection) {
      fetchCollectionInfo();
    } else {
      setCollectionInfo(null);
    }
  }, [selectedCollection]);

  return (
    <Layout style={{ minHeight: '100vh', background: '#141519' }}>
      <Sider
        breakpoint="lg"
        collapsedWidth="0"
        width={275}
        style={{
          height: '100vh',
          position: 'fixed',
          left: 0,
          top: 0,
          bottom: 0,
          background: '#1a1d23',
          display: 'flex',
          flexDirection: 'column',
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
            flexShrink: 0,
          }}
        >
          RAGBase
        </div>
        <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          <CollectionsSidebar
            selectedCollection={selectedCollection}
            onSelectCollection={setSelectedCollection}
          />
        </div>
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
            {selectedCollection ? (
              <Card
                title={
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span style={{ fontSize: 20, fontWeight: 500 }}>{selectedCollection}</span>
                    {collectionInfo && (
                      <Text type="secondary" style={{ fontSize: '12px', fontWeight: 'normal' }}>
                        {collectionInfo.model} • {collectionInfo.vector_size}d • {collectionInfo.distance_metric}
                      </Text>
                    )}
                  </div>
                }
                extra={
                  <Button
                    type="text"
                    icon={<InfoCircleOutlined />}
                    onClick={handleShowInfo}
                    size="large"
                  />
                }
                style={{ width: '100%' }}
                styles={{
                  body: { padding: 24 },
                }}
              >
                <CollectionView collectionName={selectedCollection} onShowInfo={handleShowInfo} />
              </Card>
            ) : (
              <Card style={{ width: '100%' }}>
                <Empty
                  image={<DatabaseOutlined style={{ fontSize: 64, color: '#8c8c8c' }} />}
                  description={
                    <div>
                      <Title level={4} style={{ marginTop: 16 }}>No Collection Selected</Title>
                      <Text type="secondary">
                        Select a collection from the sidebar or create a new one to get started
                      </Text>
                    </div>
                  }
                />
              </Card>
            )}
          </div>

          {/* Collection Info Modal */}
          <Modal
            title={`Collection Information: ${selectedCollection}`}
            open={infoModalOpen}
            onCancel={() => setInfoModalOpen(false)}
            width={720}
            footer={[
              <Button key="close" onClick={() => setInfoModalOpen(false)}>
                Close
              </Button>,
            ]}
          >
            {infoLoading ? (
              <div style={{ textAlign: 'center', padding: '40px' }}>
                <Spin size="large" />
              </div>
            ) : collectionInfo ? (
              <Space direction="vertical" style={{ width: '100%' }} size="large">
                {/* Model Header */}
                <Card 
                  size="small" 
                  style={{ 
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    border: 'none'
                  }}
                >
                  <div>
                    <Text strong style={{ color: 'white', fontSize: '18px', display: 'block' }}>
                      {collectionInfo.model}
                    </Text>
                    <Text style={{ color: 'rgba(255,255,255,0.85)', fontSize: '13px' }}>
                      Embedding Model • {collectionInfo.vector_size} dimensions • {collectionInfo.distance_metric} distance
                    </Text>
                  </div>
                </Card>

                {/* Statistics */}
                <Row gutter={16}>
                  <Col span={6}>
                    <Card size="small" title="Total Vectors" styles={{ body: { textAlign: 'center' } }}>
                      <Text strong style={{ fontSize: '24px' }}>
                        {collectionInfo.vectors_count}
                      </Text>
                    </Card>
                  </Col>
                  <Col span={6}>
                    <Card size="small" title="Indexed Vectors" styles={{ body: { textAlign: 'center' } }}>
                      <Text strong style={{ fontSize: '24px', color: '#3f8600' }}>
                        {collectionInfo.indexed_vectors_count}
                      </Text>
                    </Card>
                  </Col>
                  <Col span={6}>
                    <Card size="small" title="Points Count" styles={{ body: { textAlign: 'center' } }}>
                      <Text strong style={{ fontSize: '24px' }}>
                        {collectionInfo.points_count}
                      </Text>
                    </Card>
                  </Col>
                  <Col span={6}>
                    <Card size="small" title="Status" styles={{ body: { textAlign: 'center' } }}>
                      <Text strong style={{ fontSize: '24px', color: '#52c41a', textTransform: 'capitalize' }}>
                        {collectionInfo.status}
                      </Text>
                    </Card>
                  </Col>
                </Row>

                {/* Configuration */}
                <Card size="small" title="Advanced Configuration">
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: '32px' }}>
                    <div style={{ flex: 1 }}>
                      <Text type="secondary" style={{ fontSize: '12px', display: 'block', marginBottom: '4px' }}>
                        Segments
                      </Text>
                      <Text strong>{collectionInfo.segments_count}</Text>
                    </div>
                    <div style={{ flex: 1 }}>
                      <Text type="secondary" style={{ fontSize: '12px', display: 'block', marginBottom: '4px' }}>
                        Indexing Threshold
                      </Text>
                      <Text strong>{collectionInfo.optimizer_status || 'N/A'}</Text>
                    </div>
                    <div style={{ flex: 1 }}>
                      <Text type="secondary" style={{ fontSize: '12px', display: 'block', marginBottom: '4px' }}>
                        Optimizer Status
                      </Text>
                      <Text strong style={{ color: '#52c41a' }}>Active</Text>
                    </div>
                  </div>
                </Card>
              </Space>
            ) : null}
          </Modal>
        </Content>
      </Layout>
    </Layout>
  );
}

