'use client';

import { useState, useEffect } from 'react';
import { Menu, Button, Modal, Input, Form, Select, Space, message, Spin } from 'antd';
import { PlusOutlined, DatabaseOutlined, ReloadOutlined, InfoCircleOutlined } from '@ant-design/icons';
import { listCollections, createCollection, listModels, type ModelInfo } from '@/lib/api';

const { Text } = Typography;
import { Typography } from 'antd';

interface CollectionsSidebarProps {
  selectedCollection: string | null;
  onSelectCollection: (collection: string) => void;
}

export default function CollectionsSidebar({ selectedCollection, onSelectCollection }: CollectionsSidebarProps) {
  const [collections, setCollections] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newCollectionName, setNewCollectionName] = useState('');
  const [selectedModel, setSelectedModel] = useState<string | undefined>(undefined);
  const [selectedDistance, setSelectedDistance] = useState<string>('cosine');
  const [availableModels, setAvailableModels] = useState<ModelInfo[]>([]);
  const [modelsLoading, setModelsLoading] = useState(false);

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

  const fetchModels = async () => {
    setModelsLoading(true);
    try {
      const data = await listModels();
      setAvailableModels(data.models);
      const defaultModel = data.models.find((m) => m.is_default);
      if (defaultModel) {
        setSelectedModel(defaultModel.name);
      }
    } catch (error) {
      message.error(`Failed to fetch models: ${error}`);
    } finally {
      setModelsLoading(false);
    }
  };

  useEffect(() => {
    fetchCollections();
    fetchModels();
  }, []);

  const handleCreateCollection = async () => {
    if (!newCollectionName.trim()) {
      message.warning('Please enter a collection name');
      return;
    }

    try {
      const result = await createCollection(
        newCollectionName.trim(),
        selectedModel,
        selectedDistance
      );
      message.success(
        `Collection "${newCollectionName}" created with model "${result.model}" (${result.dimension}d)`
      );
      setIsModalOpen(false);
      setNewCollectionName('');
      const defaultModel = availableModels.find((m) => m.is_default);
      setSelectedModel(defaultModel?.name);
      setSelectedDistance('cosine');
      await fetchCollections();
      onSelectCollection(newCollectionName.trim());
    } catch (error) {
      message.error(`Failed to create collection: ${error}`);
    }
  };

  const menuItems = collections.map((collection) => ({
    key: collection,
    icon: <DatabaseOutlined />,
    label: collection,
  }));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ flex: 1, overflowY: 'auto' }}>
        <div style={{ padding: '16px 16px 8px' }}>
          <Space style={{ width: '100%', justifyContent: 'space-between' }}>
            <Text strong style={{ fontSize: '13px', color: '#8c8c8c' }}>COLLECTIONS</Text>
            <Button
              type="text"
              size="small"
              icon={<ReloadOutlined />}
              onClick={fetchCollections}
              loading={loading}
              style={{ color: '#8c8c8c' }}
            />
          </Space>
        </div>
        
        {loading && collections.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '20px' }}>
            <Spin />
          </div>
        ) : (
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={selectedCollection ? [selectedCollection] : []}
          onClick={({ key }) => onSelectCollection(key)}
          style={{ background: 'transparent', border: 'none' }}
          items={menuItems}
          className="collection-menu"
        />
        )}
      </div>

      <div style={{ padding: '8px 16px 16px' }}>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => setIsModalOpen(true)}
          block
          style={{ height: '40px', borderRadius: '8px' }}
        >
          Add Collection
        </Button>
      </div>

      <Modal
        title="Create New Collection"
        open={isModalOpen}
        onOk={handleCreateCollection}
        onCancel={() => {
          setIsModalOpen(false);
          setNewCollectionName('');
          const defaultModel = availableModels.find((m) => m.is_default);
          setSelectedModel(defaultModel?.name);
          setSelectedDistance('cosine');
        }}
        okText="Create"
        width={600}
      >
        <Space direction="vertical" style={{ width: '100%' }} size="small">
          <Form layout="vertical">
            <Form.Item label="Collection Name" required>
              <Input
                placeholder="Enter collection name"
                value={newCollectionName}
                onChange={(e) => setNewCollectionName(e.target.value)}
                onPressEnter={handleCreateCollection}
                autoFocus
                size="large"
              />
            </Form.Item>

            <Form.Item 
              label="Embedding Model"
              tooltip="The model used to convert text into vector embeddings"
            >
              <Select
                value={selectedModel}
                onChange={setSelectedModel}
                loading={modelsLoading}
                placeholder="Select an embedding model"
                size="large"
                style={{ width: '100%' }}
                optionLabelProp="label"
              >
                {availableModels.map((model) => (
                  <Select.Option 
                    key={model.name} 
                    value={model.name}
                    label={
                      <span>
                        {model.name}
                        {model.is_default && <span style={{ marginLeft: '8px', fontSize: '11px', color: '#1890ff' }}>Default</span>}
                      </span>
                    }
                  >
                    <div>
                      <div style={{ fontWeight: 600 }}>
                        {model.name}
                        {model.is_default && (
                          <span style={{ marginLeft: '8px', fontSize: '11px', color: '#1890ff' }}>Default</span>
                        )}
                      </div>
                      <div style={{ fontSize: '12px', color: '#8c8c8c', marginTop: '2px' }}>
                        {model.description} • {model.dimension} dimensions
                      </div>
                    </div>
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>

            <Form.Item 
              label="Distance Metric"
              tooltip="The method used to calculate similarity between vectors"
            >
              <Select
                value={selectedDistance}
                onChange={setSelectedDistance}
                size="large"
                style={{ width: '100%' }}
                optionLabelProp="label"
              >
                <Select.Option value="cosine" label="Cosine">
                  <div>
                    <div style={{ fontWeight: 600 }}>Cosine</div>
                    <div style={{ fontSize: '12px', color: '#8c8c8c', marginTop: '2px' }}>
                      Best for most use cases (measures angle)
                    </div>
                  </div>
                </Select.Option>
                <Select.Option value="euclidean" label="Euclidean">
                  <div>
                    <div style={{ fontWeight: 600 }}>Euclidean</div>
                    <div style={{ fontSize: '12px', color: '#8c8c8c', marginTop: '2px' }}>
                      Measures straight-line distance
                    </div>
                  </div>
                </Select.Option>
                <Select.Option value="dot" label="Dot Product">
                  <div>
                    <div style={{ fontWeight: 600 }}>Dot Product</div>
                    <div style={{ fontSize: '12px', color: '#8c8c8c', marginTop: '2px' }}>
                      Fast, good for normalized vectors
                    </div>
                  </div>
                </Select.Option>
              </Select>
            </Form.Item>
          </Form>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '8px' }}>
            <InfoCircleOutlined style={{ fontSize: '12px', color: '#8c8c8c' }} />
            <Text type="secondary" style={{ fontSize: '12px' }}>
              Once created, a collection's embedding model cannot be changed.
            </Text>
          </div>
        </Space>
      </Modal>
    </div>
  );
}

