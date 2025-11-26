'use client';

import { useState, useEffect } from 'react';
import { Button, Input, List, Card, Modal, message, Space, Popconfirm, Table, Tag, Typography, Divider, Descriptions, Statistic, Row, Col, Select, Form, Alert } from 'antd';
import { PlusOutlined, DeleteOutlined, ReloadOutlined, EyeOutlined, DatabaseOutlined, RobotOutlined, InfoCircleOutlined } from '@ant-design/icons';
import { listCollections, createCollection, deleteCollection, getCollectionInfo, listModels, type CollectionInfo, type CollectionDocument, type ModelInfo } from '@/lib/api';

const { Text, Paragraph } = Typography;
const { Option } = Select;

export default function CollectionsPanel() {
  const [collections, setCollections] = useState<string[]>([]);
  const [collectionsInfo, setCollectionsInfo] = useState<Record<string, CollectionInfo>>({});
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newCollectionName, setNewCollectionName] = useState('');
  const [selectedModel, setSelectedModel] = useState<string | undefined>(undefined);
  const [selectedDistance, setSelectedDistance] = useState<string>('cosine');
  const [availableModels, setAvailableModels] = useState<ModelInfo[]>([]);
  const [modelsLoading, setModelsLoading] = useState(false);
  const [isBrowseModalOpen, setIsBrowseModalOpen] = useState(false);
  const [selectedCollection, setSelectedCollection] = useState<string>('');
  const [collectionInfo, setCollectionInfo] = useState<CollectionInfo | null>(null);
  const [browseLoading, setBrowseLoading] = useState(false);

  const fetchCollections = async () => {
    setLoading(true);
    try {
      const data = await listCollections();
      setCollections(data);
      
      // Fetch info for each collection
      const infoPromises = data.map(async (collectionName) => {
        try {
          const info = await getCollectionInfo(collectionName, 0, 0); // Just get metadata, no documents
          return { name: collectionName, info };
        } catch (error) {
          console.error(`Failed to fetch info for ${collectionName}:`, error);
          return null;
        }
      });
      
      const results = await Promise.all(infoPromises);
      const infoMap: Record<string, CollectionInfo> = {};
      results.forEach((result) => {
        if (result) {
          infoMap[result.name] = result.info;
        }
      });
      setCollectionsInfo(infoMap);
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
      // Set default model as selected
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
      // Reset to default model
      const defaultModel = availableModels.find((m) => m.is_default);
      setSelectedModel(defaultModel?.name);
      setSelectedDistance('cosine');
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
      dataIndex: 'text',
      key: 'text',
      render: (text: string, record: CollectionDocument) => (
        <>
          <Space direction="vertical" style={{ width: '100%' }} size="small">
            <div>
              <Text type="secondary" style={{ fontSize: '12px' }}>
                ID: {record.id}
              </Text>
            </div>
            <div>
              <Text>{text}</Text>
            </div>
            {Object.keys(record.metadata).length > 0 && (
              <div style={{ marginTop: 8 }}>
                <Space wrap size="small">
                  {Object.entries(record.metadata).map(([key, value]) => (
                    <Tag key={key} style={{ fontSize: '11px' }}>
                      <Text type="secondary" style={{ fontSize: '11px' }}>{key}:</Text> {JSON.stringify(value)}
                    </Tag>
                  ))}
                </Space>
              </div>
            )}
          </Space>
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
        renderItem={(collection) => {
          const info = collectionsInfo[collection];
          return (
            <List.Item>
              <Card
                title={collection}
                extra={
                  <Space>
                    <Button
                      type="text"
                      icon={<EyeOutlined />}
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleBrowseCollection(collection);
                      }}
                    />
                    <Popconfirm
                      title="Delete Collection"
                      description="Are you sure you want to delete this collection?"
                      onConfirm={() => handleDeleteCollection(collection)}
                      okText="Yes"
                      cancelText="No"
                      onCancel={(e) => e?.stopPropagation()}
                    >
                      <Button
                        type="text"
                        danger
                        icon={<DeleteOutlined />}
                        size="small"
                        onClick={(e) => e.stopPropagation()}
                      />
                    </Popconfirm>
                  </Space>
                }
                hoverable
                style={{ cursor: 'pointer' }}
                onClick={() => handleBrowseCollection(collection)}
              >
                <Space direction="vertical" size="small" style={{ width: '100%' }}>
                  {info ? (
                    <>
                      <Space align="center">
                        <RobotOutlined style={{ fontSize: '20px', color: '#722ed1' }} />
                        <div>
                          <Text strong style={{ display: 'block', fontSize: '13px' }}>
                            {info.model}
                          </Text>
                          <Text type="secondary" style={{ fontSize: '11px' }}>
                            Embedding Model
                          </Text>
                        </div>
                      </Space>
                      
                      <Divider style={{ margin: '8px 0' }} />
                      
                      <Space direction="vertical" size={2} style={{ width: '100%' }}>
                        <Space style={{ justifyContent: 'space-between', width: '100%' }}>
                          <Text type="secondary" style={{ fontSize: '11px' }}>Vectors:</Text>
                          <Tag color="blue" style={{ fontSize: '11px' }}>{info.vectors_count.toLocaleString()}</Tag>
                        </Space>
                        <Space style={{ justifyContent: 'space-between', width: '100%' }}>
                          <Text type="secondary" style={{ fontSize: '11px' }}>Dimension:</Text>
                          <Tag color="cyan" style={{ fontSize: '11px' }}>{info.vector_size}d</Tag>
                        </Space>
                        <Space style={{ justifyContent: 'space-between', width: '100%' }}>
                          <Text type="secondary" style={{ fontSize: '11px' }}>Distance:</Text>
                          <Tag color="purple" style={{ fontSize: '11px' }}>{info.distance_metric}</Tag>
                        </Space>
                      </Space>
                    </>
                  ) : (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <DatabaseOutlined style={{ fontSize: '24px', color: '#1890ff' }} />
                      <Text type="secondary">Loading...</Text>
                    </div>
                  )}
                </Space>
              </Card>
            </List.Item>
          );
        }}
      />

      <Modal
        title="Create New Collection"
        open={isModalOpen}
        onOk={handleCreateCollection}
        onCancel={() => {
          setIsModalOpen(false);
          setNewCollectionName('');
          // Reset to default
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
                  <Option 
                    key={model.name} 
                    value={model.name}
                    label={
                      <span>
                        {model.name}
                        {model.is_default && <Tag color="blue" style={{ marginLeft: '8px', fontSize: '11px' }}>Default</Tag>}
                      </span>
                    }
                  >
                    <div>
                      <div style={{ fontWeight: 600 }}>
                        {model.name}
                        {model.is_default && (
                          <Tag color="blue" style={{ marginLeft: '8px', fontSize: '11px' }}>Default</Tag>
                        )}
                      </div>
                      <div style={{ fontSize: '12px', color: '#8c8c8c', marginTop: '2px' }}>
                        {model.description} • {model.dimension} dimensions
                      </div>
                    </div>
                  </Option>
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
                <Option value="cosine" label="Cosine">
                  <div>
                    <div style={{ fontWeight: 600 }}>Cosine</div>
                    <div style={{ fontSize: '12px', color: '#8c8c8c', marginTop: '2px' }}>
                      Best for most use cases (measures angle)
                    </div>
                  </div>
                </Option>
                <Option value="euclidean" label="Euclidean">
                  <div>
                    <div style={{ fontWeight: 600 }}>Euclidean</div>
                    <div style={{ fontSize: '12px', color: '#8c8c8c', marginTop: '2px' }}>
                      Measures straight-line distance
                    </div>
                  </div>
                </Option>
                <Option value="dot" label="Dot Product">
                  <div>
                    <div style={{ fontWeight: 600 }}>Dot Product</div>
                    <div style={{ fontSize: '12px', color: '#8c8c8c', marginTop: '2px' }}>
                      Fast, good for normalized vectors
                    </div>
                  </div>
                </Option>
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

      <Modal
        title={
          <Space>
            <DatabaseOutlined />
            <span>{selectedCollection}</span>
          </Space>
        }
        open={isBrowseModalOpen}
        onCancel={() => {
          setIsBrowseModalOpen(false);
          setCollectionInfo(null);
        }}
        width={1400}
        footer={[
          <Button key="close" onClick={() => setIsBrowseModalOpen(false)}>
            Close
          </Button>,
        ]}
      >
        {collectionInfo && (
          <Space direction="vertical" style={{ width: '100%' }} size="large">
            {/* Embedding Model Header - Most Prominent */}
            <Card 
              size="small" 
              style={{ 
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                border: 'none'
              }}
            >
              <Space align="center" style={{ width: '100%', justifyContent: 'space-between' }}>
                <Space align="center">
                  <RobotOutlined style={{ fontSize: '32px', color: 'white' }} />
                  <div>
                    <Text strong style={{ color: 'white', fontSize: '18px', display: 'block' }}>
                      {collectionInfo.model}
                    </Text>
                    <Text style={{ color: 'rgba(255,255,255,0.85)', fontSize: '13px' }}>
                      Embedding Model • {collectionInfo.vector_size} dimensions • {collectionInfo.distance_metric} distance
                    </Text>
                  </div>
                </Space>
                <Tag color="purple" style={{ fontSize: '12px' }}>
                  Immutable
                </Tag>
              </Space>
            </Card>

            <Row gutter={16}>
              <Col span={6}>
                <Card size="small">
                  <Statistic
                    title="Total Vectors"
                    value={collectionInfo.vectors_count}
                    prefix={<DatabaseOutlined />}
                  />
                </Card>
              </Col>
              <Col span={6}>
                <Card size="small">
                  <Statistic
                    title="Indexed Vectors"
                    value={collectionInfo.indexed_vectors_count}
                    valueStyle={{ color: '#3f8600' }}
                  />
                </Card>
              </Col>
              <Col span={6}>
                <Card size="small">
                  <Statistic
                    title="Points Count"
                    value={collectionInfo.points_count}
                  />
                </Card>
              </Col>
              <Col span={6}>
                <Card size="small">
                  <Space direction="vertical" size="small" style={{ width: '100%' }}>
                    <Text type="secondary" style={{ fontSize: '14px' }}>Status</Text>
                    <Tag color="green" style={{ fontSize: '14px' }}>{collectionInfo.status}</Tag>
                  </Space>
                </Card>
              </Col>
            </Row>

            <Card size="small" title="Advanced Configuration">
              <Descriptions column={3} size="small">
                <Descriptions.Item label="Segments">
                  {collectionInfo.segments_count}
                </Descriptions.Item>
                <Descriptions.Item label="Indexing Threshold">
                  {collectionInfo.optimizer_status || 'N/A'}
                </Descriptions.Item>
                <Descriptions.Item label="Optimizer Status">
                  <Tag color="green">Active</Tag>
                </Descriptions.Item>
              </Descriptions>
            </Card>
            
            <Table
              columns={columns}
              dataSource={collectionInfo.documents}
              rowKey="id"
              loading={browseLoading}
              pagination={false}
              size="middle"
              showHeader={false}
              scroll={{ y: '45vh' }}
            />
          </Space>
        )}
      </Modal>
    </div>
  );
}

