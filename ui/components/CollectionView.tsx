'use client';

import { useState, useEffect } from 'react';
import { Tabs, Card, Spin, message, Space, Tag, Typography, Descriptions, Statistic, Row, Col, Table, Modal, Button } from 'antd';
import { DatabaseOutlined, FileTextOutlined, SearchOutlined, InfoCircleOutlined, FileOutlined } from '@ant-design/icons';
import { getCollectionInfo, type CollectionInfo, type CollectionDocument } from '@/lib/api';
import UpsertPanel from './UpsertPanel';
import SearchPanel from './SearchPanel';

const { Text } = Typography;

interface CollectionViewProps {
  collectionName: string;
  onShowInfo: () => void;
}

export default function CollectionView({ collectionName, onShowInfo }: CollectionViewProps) {
  const [collectionInfo, setCollectionInfo] = useState<CollectionInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('documents');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);

  const fetchCollectionInfo = async (page: number = currentPage, size: number = pageSize) => {
    setLoading(true);
    try {
      const offset = (page - 1) * size;
      const info = await getCollectionInfo(collectionName, size, offset);
      setCollectionInfo(info);
    } catch (error) {
      message.error(`Failed to fetch collection info: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setCurrentPage(1); // Reset to page 1 when collection changes
    fetchCollectionInfo(1, pageSize);
  }, [collectionName]);

  useEffect(() => {
    fetchCollectionInfo(currentPage, pageSize);
  }, [currentPage, pageSize]);

  const handleUpsertComplete = () => {
    // Refresh the documents list
    fetchCollectionInfo(currentPage, pageSize);
  };

  const columns = [
    {
      dataIndex: 'text',
      key: 'text',
      render: (text: string, record: CollectionDocument) => (
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
      ),
    },
  ];

  const tabItems = [
    {
      key: 'documents',
      label: (
        <span>
          <FileOutlined style={{ marginRight: '8px' }} />
          Documents
        </span>
      ),
      children: loading ? (
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <Spin size="large" />
        </div>
      ) : collectionInfo ? (
        <Table
          columns={columns}
          dataSource={collectionInfo.documents}
          rowKey="id"
          pagination={{
            current: currentPage,
            pageSize: pageSize,
            total: collectionInfo.vectors_count,
            onChange: (page, size) => {
              setCurrentPage(page);
              if (size !== pageSize) {
                setPageSize(size);
                setCurrentPage(1); // Reset to first page when page size changes
              }
            },
            showSizeChanger: true,
            pageSizeOptions: ['10', '25', '50', '100', '200'],
            showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} documents`,
          }}
          size="middle"
          showHeader={false}
          scroll={{ y: 'calc(100vh - 400px)' }}
        />
      ) : null,
    },
    {
      key: 'upsert',
      label: (
        <span>
          <FileTextOutlined style={{ marginRight: '8px' }} />
          Upsert Documents
        </span>
      ),
      children: <UpsertPanel preselectedCollection={collectionName} onUpsertComplete={handleUpsertComplete} />,
    },
    {
      key: 'search',
      label: (
        <span>
          <SearchOutlined style={{ marginRight: '8px' }} />
          Search
        </span>
      ),
      children: <SearchPanel preselectedCollection={collectionName} />,
    },
  ];

  return (
    <Tabs
      activeKey={activeTab}
      onChange={setActiveTab}
      items={tabItems}
      size="large"
    />
  );
}

