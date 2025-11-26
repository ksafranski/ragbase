'use client';

import { useState, useEffect } from 'react';
import {
  Button,
  Input,
  Select,
  Form,
  message,
  Space,
  Card,
} from 'antd';
import { PlusOutlined, MinusCircleOutlined, SendOutlined } from '@ant-design/icons';
import { listCollections, upsertDocuments, type Document } from '@/lib/api';

const { TextArea } = Input;

interface DocumentFormData {
  text: string;
  metadata?: string;
}

export default function UpsertPanel() {
  const [collections, setCollections] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
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

  const handleSubmit = async (values: {
    collection: string;
    documents: DocumentFormData[];
  }) => {
    setLoading(true);
    try {
      const documents: Document[] = values.documents.map((doc) => ({
        text: doc.text,
        metadata: doc.metadata ? JSON.parse(doc.metadata) : undefined,
      }));

      const result = await upsertDocuments(values.collection, documents);
      message.success(
        `Successfully inserted ${result.inserted} document(s) into "${result.collection}"`
      );
      form.resetFields();
    } catch (error) {
      message.error(`Failed to upsert documents: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>

        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          initialValues={{
            documents: [{ text: '', metadata: '' }],
          }}
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

          <Form.List name="documents">
            {(fields, { add, remove }) => (
              <>
                {fields.map(({ key, name, ...restField }) => (
                  <Card
                    key={key}
                    size="small"
                    style={{ marginBottom: 16 }}
                    extra={
                      fields.length > 1 ? (
                        <MinusCircleOutlined
                          onClick={() => remove(name)}
                          style={{ color: 'red' }}
                        />
                      ) : null
                    }
                  >
                    <Form.Item
                      {...restField}
                      label="Document Text"
                      name={[name, 'text']}
                      rules={[{ required: true, message: 'Please enter document text' }]}
                    >
                      <TextArea
                        rows={4}
                        placeholder="Enter document text..."
                      />
                    </Form.Item>

                    <Form.Item
                      {...restField}
                      label="Metadata (JSON, optional)"
                      name={[name, 'metadata']}
                      rules={[
                        {
                          validator: (_, value) => {
                            if (!value || value.trim() === '') return Promise.resolve();
                            try {
                              JSON.parse(value);
                              return Promise.resolve();
                            } catch {
                              return Promise.reject(new Error('Invalid JSON format'));
                            }
                          },
                        },
                      ]}
                    >
                      <TextArea
                        rows={2}
                        placeholder='{"category": "example", "author": "name"}'
                      />
                    </Form.Item>
                  </Card>
                ))}

                <Form.Item>
                  <Button
                    type="dashed"
                    onClick={() => add()}
                    block
                    icon={<PlusOutlined />}
                  >
                    Add Document
                  </Button>
                </Form.Item>
              </>
            )}
          </Form.List>

          <Form.Item>
            <Space>
              <Button
                type="primary"
                htmlType="submit"
                loading={loading}
                icon={<SendOutlined />}
              >
                Upsert Documents
              </Button>
              <Button onClick={() => form.resetFields()}>Reset</Button>
            </Space>
          </Form.Item>
        </Form>
    </div>
  );
}

