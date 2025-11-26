'use client';

import { useState } from 'react';
import {
  Button,
  Input,
  Form,
  message,
  Card,
  Typography,
  Alert,
  Space,
  Tag,
} from 'antd';
import { ThunderboltOutlined } from '@ant-design/icons';
import { generateEmbeddings, type EmbedResponse } from '@/lib/api';

const { TextArea } = Input;
const { Text, Paragraph } = Typography;

export default function EmbedPanel() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<EmbedResponse | null>(null);
  const [form] = Form.useForm();

  const handleGenerate = async (values: { text: string; multiple: boolean }) => {
    setLoading(true);
    try {
      const textInput = values.multiple
        ? values.text.split('\n').filter((line) => line.trim() !== '')
        : values.text;

      const embedResult = await generateEmbeddings(textInput);
      setResult(embedResult);
      message.success(
        `Generated ${embedResult.embeddings.length} embedding(s) successfully`
      );
    } catch (error) {
      message.error(`Failed to generate embeddings: ${error}`);
      setResult(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
        <Form
          form={form}
          layout="vertical"
          onFinish={handleGenerate}
          style={{ marginBottom: 24 }}
        >
          <Form.Item
            label="Text Input"
            name="text"
            rules={[{ required: true, message: 'Please enter text to embed' }]}
            extra="Enter one text or multiple texts (one per line)"
          >
            <TextArea
              rows={6}
              placeholder="Enter text to generate embeddings...&#10;You can enter multiple lines for batch processing."
            />
          </Form.Item>

          <Form.Item>
            <Space>
              <Button
                type="primary"
                htmlType="submit"
                loading={loading}
                icon={<ThunderboltOutlined />}
              >
                Generate Embeddings
              </Button>
              <Button onClick={() => {
                form.resetFields();
                setResult(null);
              }}>
                Reset
              </Button>
            </Space>
          </Form.Item>
        </Form>

      {result && (
        <Card style={{ marginTop: 24 }} title="Embedding Results">
          <Space direction="vertical" style={{ width: '100%' }} size="middle">
            <div>
              <Tag color="blue">Model: {result.model}</Tag>
              <Tag color="green">Dimension: {result.dimension}</Tag>
              <Tag color="purple">Count: {result.embeddings.length}</Tag>
            </div>

            <Alert
              message="Embeddings Generated"
              description={`Successfully generated ${result.embeddings.length} embedding vector(s). Each vector has ${result.dimension} dimensions.`}
              type="success"
              showIcon
            />

            {result.embeddings.map((embedding, index) => (
              <Card
                key={index}
                size="small"
                title={`Embedding ${index + 1}`}
                type="inner"
              >
                <Paragraph
                  copyable
                  ellipsis={{
                    rows: 2,
                    expandable: true,
                    symbol: 'Show more',
                  }}
                  style={{
                    fontFamily: 'monospace',
                    fontSize: 12,
                    background: '#1a1d23',
                    color: '#e6e8eb',
                    padding: 8,
                    borderRadius: 4,
                  }}
                >
                  {JSON.stringify(embedding)}
                </Paragraph>
                <Text type="secondary" style={{ fontSize: 12 }}>
                  Vector length: {embedding.length} dimensions
                </Text>
              </Card>
            ))}
          </Space>
        </Card>
      )}
    </div>
  );
}

