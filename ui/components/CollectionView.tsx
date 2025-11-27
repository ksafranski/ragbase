'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Tabs, Card, Spin, message, Space, Tag, Typography, Descriptions, Statistic, Row, Col, Table, Modal, Button, Divider, Pagination } from 'antd';
import { DatabaseOutlined, FileTextOutlined, SearchOutlined, InfoCircleOutlined, FileOutlined, LoadingOutlined } from '@ant-design/icons';
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
  const abortControllerRef = useRef<AbortController | null>(null);

  const fetchCollectionInfo = useCallback(async (page: number, size: number) => {
    // Cancel any pending request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Create new abort controller for this request
    abortControllerRef.current = new AbortController();
    
    setLoading(true);
    try {
      const offset = (page - 1) * size;
      const info = await getCollectionInfo(collectionName, size, offset);
      // Only update state if this request wasn't aborted
      if (!abortControllerRef.current.signal.aborted) {
        setCollectionInfo(info);
      }
    } catch (error) {
      if (!abortControllerRef.current.signal.aborted) {
        message.error(`Failed to fetch collection info: ${error}`);
      }
    } finally {
      if (!abortControllerRef.current.signal.aborted) {
        setLoading(false);
      }
    }
  }, [collectionName]);

  // Reset to page 1 when collection changes
  useEffect(() => {
    setCurrentPage(1);
  }, [collectionName]);

  // Fetch data whenever page, pageSize, or collection changes
  useEffect(() => {
    fetchCollectionInfo(currentPage, pageSize);
    
    // Cleanup: abort request if component unmounts or dependencies change
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [currentPage, pageSize, fetchCollectionInfo]);

  const handleUpsertComplete = useCallback(() => {
    // Refresh the documents list
    fetchCollectionInfo(currentPage, pageSize);
  }, [currentPage, pageSize, fetchCollectionInfo]);

  const columns = [
    {
      dataIndex: 'text',
      key: 'text',
      render: (text: string, record: CollectionDocument) => (
        <Space direction="vertical" style={{ width: '100%' }} size="small">
          <div>
            <Tag style={{ fontSize: '11px' }}>
              <Text type="secondary" style={{ fontSize: '11px' }}>ID:</Text> {record.id}
            </Tag>
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
      children: collectionInfo ? (
        <div style={{ position: 'relative' }}>
          {loading && (
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(0, 0, 0, 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 10,
            }}>
              <Spin indicator={<LoadingOutlined style={{ fontSize: 48 }} spin />} />
            </div>
          )}
          <Table
            columns={columns}
            dataSource={collectionInfo.documents}
            rowKey="id"
            pagination={false}
            size="middle"
            showHeader={false}
            scroll={{ y: 'calc(100vh - 400px)' }}
          />
          <Divider style={{ margin: '24px 0 16px' }} />
          <div style={{ display: 'flex', justifyContent: 'center', paddingBottom: '16px' }}>
            <Pagination
              current={currentPage}
              pageSize={pageSize}
              total={collectionInfo.vectors_count}
              onChange={(page, size) => {
                setCurrentPage(page);
                if (size !== pageSize) {
                  setPageSize(size);
                  setCurrentPage(1);
                }
              }}
              showSizeChanger
              pageSizeOptions={['10', '25', '50', '100', '200']}
              showTotal={(total, range) => `${range[0]}-${range[1]} of ${total} documents`}
            />
          </div>
        </div>
      ) : loading ? (
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <Spin indicator={<LoadingOutlined style={{ fontSize: 48 }} spin />} />
        </div>
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

