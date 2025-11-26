'use client';

import { useState, useEffect } from 'react';
import {
  Button,
  Input,
  Select,
  Form,
  message,
  Card,
  List,
  Typography,
  Space,
  InputNumber,
  Tag,
} from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import { listCollections, searchDocuments, type SearchResult } from '@/lib/api';

const { TextArea } = Input;
const { Text, Paragraph } = Typography;

export default function SearchPanel() {
  const [collections, setCollections] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [form] = Form.useForm();

  useEffect(() => {
    fetchCollections();
  }, []);

  const fetchCollections = async () => {
    try {
      const data = await listCollections();
      setCollections(data);
    } catch (error) {
      message.error(`Failed to fetch collections: ${error}`);
    }
  };

  const handleSearch = async (values: {
    collection: string;
    query: string;
    limit: number;
    scoreThreshold?: number;
  }) => {
    setLoading(true);
    setSearchQuery(values.query);
    try {
      const result = await searchDocuments(
        values.collection,
        values.query,
        values.limit,
        values.scoreThreshold
      );
      setResults(result.results);
      if (result.results.length === 0) {
        message.info('No results found');
      } else {
        message.success(`Found ${result.results.length} result(s)`);
      }
    } catch (error) {
      message.error(`Search failed: ${error}`);
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSearch}
          initialValues={{
            limit: 5,
            scoreThreshold: undefined,
          }}
          style={{ marginBottom: 24 }}
        >
          <Form.Item
            label="Collection"
            name="collection"
            rules={[{ required: true, message: 'Please select a collection' }]}
          >
            <Select
              placeholder="Select a collection"
              options={collections.map((c) => ({ label: c, value: c }))}
              showSearch
            />
          </Form.Item>

          <Form.Item
            label="Search Query"
            name="query"
            rules={[{ required: true, message: 'Please enter a search query' }]}
          >
            <TextArea
              rows={3}
              placeholder="Enter your search query..."
            />
          </Form.Item>

          <Space size="large">
            <Form.Item
              label="Limit"
              name="limit"
              rules={[{ required: true, message: 'Please enter a limit' }]}
            >
              <InputNumber min={1} max={100} style={{ width: 120 }} />
            </Form.Item>

            <Form.Item
              label="Score Threshold (optional)"
              name="scoreThreshold"
              tooltip="Only return results with score above this threshold"
            >
              <InputNumber min={0} max={1} step={0.1} style={{ width: 120 }} />
            </Form.Item>
          </Space>

          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              icon={<SearchOutlined />}
            >
              Search
            </Button>
          </Form.Item>
        </Form>

      {results.length > 0 && (
        <Card
          title={
            <span>
              Search Results for: <Text type="secondary">{searchQuery}</Text>
            </span>
          }
        >
          <List
            itemLayout="vertical"
            dataSource={results}
            renderItem={(result) => (
              <List.Item
                key={result.id}
                extra={
                  <Tag color={result.score > 0.8 ? 'green' : result.score > 0.5 ? 'blue' : 'default'}>
                    Score: {result.score.toFixed(4)}
                  </Tag>
                }
              >
                <List.Item.Meta
                  title={`ID: ${result.id}`}
                  description={
                    <div>
                      <Paragraph>{result.text}</Paragraph>
                      {Object.keys(result.metadata).length > 0 && (
                        <div>
                          <Text strong>Metadata: </Text>
                          {Object.entries(result.metadata).map(([key, value]) => (
                            <Tag key={key}>
                              {key}: {JSON.stringify(value)}
                            </Tag>
                          ))}
                        </div>
                      )}
                    </div>
                  }
                />
              </List.Item>
            )}
          />
        </Card>
      )}
    </div>
  );
}

