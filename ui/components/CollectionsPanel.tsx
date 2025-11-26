'use client';

import { useState, useEffect } from 'react';
import { Button, Input, List, Card, Modal, message, Space, Popconfirm, Table, Tag, Typography } from 'antd';
import { PlusOutlined, DeleteOutlined, ReloadOutlined, EyeOutlined } from '@ant-design/icons';
import { listCollections, createCollection, deleteCollection, getCollectionInfo, type CollectionInfo, type CollectionDocument } from '@/lib/api';

const { Text } = Typography;

export default function CollectionsPanel() {
  const [collections, setCollections] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newCollectionName, setNewCollectionName] = useState('');
  const [isBrowseModalOpen, setIsBrowseModalOpen] = useState(false);
  const [selectedCollection, setSelectedCollection] = useState<string>('');
  const [collectionInfo, setCollectionInfo] = useState<CollectionInfo | null>(null);
  const [browseLoading, setBrowseLoading] = useState(false);

  const fetchCollections = async () => {
    setLoading(true);
    try {
      const data = await listCollections();
      setCollections(data);
    } catch (error) {
      message.error(`Failed to fetch collections: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCollections();
  }, []);

  const handleCreateCollection = async () => {
    if (!newCollectionName.trim()) {
      message.warning('Please enter a collection name');
      return;
    }

    try {
      await createCollection(newCollectionName.trim());
      message.success(`Collection "${newCollectionName}" created successfully`);
      setIsModalOpen(false);
      setNewCollectionName('');
      fetchCollections();
    } catch (error) {
      message.error(`Failed to create collection: ${error}`);
    }
  };

  const handleDeleteCollection = async (collectionName: string) => {
    try {
      await deleteCollection(collectionName);
      message.success(`Collection "${collectionName}" deleted successfully`);
      fetchCollections();
    } catch (error) {
      message.error(`Failed to delete collection: ${error}`);
    }
  };

  const handleBrowseCollection = async (collectionName: string) => {
    setSelectedCollection(collectionName);
    setIsBrowseModalOpen(true);
    setBrowseLoading(true);
    try {
      const info = await getCollectionInfo(collectionName, 100, 0);
      setCollectionInfo(info);
    } catch (error) {
      message.error(`Failed to fetch collection info: ${error}`);
    } finally {
      setBrowseLoading(false);
    }
  };

  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 120,
      ellipsis: true,
    },
    {
      title: 'Text',
      dataIndex: 'text',
      key: 'text',
      ellipsis: true,
    },
    {
      title: 'Metadata',
      dataIndex: 'metadata',
      key: 'metadata',
      render: (metadata: Record<string, any>) => (
        <>
          {Object.entries(metadata).map(([key, value]) => (
            <Tag key={key}>
              {key}: {JSON.stringify(value)}
            </Tag>
          ))}
        </>
      ),
    },
  ];

  return (
    <div>
      <Space style={{ marginBottom: 16 }}>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => setIsModalOpen(true)}
        >
          Create Collection
        </Button>
        <Button icon={<ReloadOutlined />} onClick={fetchCollections} loading={loading}>
          Refresh
        </Button>
      </Space>

      <List
        grid={{ gutter: 16, xs: 1, sm: 2, md: 2, lg: 3, xl: 4, xxl: 4 }}
        dataSource={collections}
        loading={loading}
        locale={{ emptyText: 'No collections found. Create one to get started!' }}
        renderItem={(collection) => (
          <List.Item>
            <Card
              title={collection}
              extra={
                <Space>
                  <Button
                    type="text"
                    icon={<EyeOutlined />}
                    size="small"
                    onClick={() => handleBrowseCollection(collection)}
                  />
                  <Popconfirm
                    title="Delete Collection"
                    description="Are you sure you want to delete this collection?"
                    onConfirm={() => handleDeleteCollection(collection)}
                    okText="Yes"
                    cancelText="No"
                  >
                    <Button
                      type="text"
                      danger
                      icon={<DeleteOutlined />}
                      size="small"
                    />
                  </Popconfirm>
                </Space>
              }
              hoverable
              style={{ cursor: 'pointer' }}
              onClick={() => handleBrowseCollection(collection)}
            >
              <p style={{ color: '#888' }}>Click to browse collection</p>
            </Card>
          </List.Item>
        )}
      />

      <Modal
        title="Create New Collection"
        open={isModalOpen}
        onOk={handleCreateCollection}
        onCancel={() => {
          setIsModalOpen(false);
          setNewCollectionName('');
        }}
        okText="Create"
      >
        <Input
          placeholder="Enter collection name"
          value={newCollectionName}
          onChange={(e) => setNewCollectionName(e.target.value)}
          onPressEnter={handleCreateCollection}
          autoFocus
        />
      </Modal>

      <Modal
        title={`Browse Collection: ${selectedCollection}`}
        open={isBrowseModalOpen}
        onCancel={() => {
          setIsBrowseModalOpen(false);
          setCollectionInfo(null);
        }}
        width={1000}
        footer={[
          <Button key="close" onClick={() => setIsBrowseModalOpen(false)}>
            Close
          </Button>,
        ]}
      >
        {collectionInfo && (
          <Space direction="vertical" style={{ width: '100%' }} size="middle">
            <div>
              <Text strong>Status: </Text>
              <Tag color="green">{collectionInfo.status}</Tag>
              <Text strong>Points: </Text>
              <Tag color="blue">{collectionInfo.points_count}</Tag>
              <Text strong>Vectors: </Text>
              <Tag color="purple">{collectionInfo.vectors_count}</Tag>
            </div>
            
            <Table
              columns={columns}
              dataSource={collectionInfo.documents}
              rowKey="id"
              loading={browseLoading}
              pagination={{
                pageSize: 10,
                showSizeChanger: true,
                showTotal: (total) => `Total ${total} documents`,
              }}
              scroll={{ x: 800 }}
            />
          </Space>
        )}
      </Modal>
    </div>
  );
}

