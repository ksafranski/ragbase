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
  Collapse,
  Upload,
  Progress,
  Modal,
} from 'antd';
import { PlusOutlined, MinusCircleOutlined, SendOutlined, UploadOutlined, InboxOutlined } from '@ant-design/icons';
import { listCollections, upsertDocuments, type Document } from '@/lib/api';
import type { UploadFile as AntUploadFile } from 'antd/es/upload/interface';
import { parseFile } from '@/lib/fileParser';

const { TextArea } = Input;
const { Panel } = Collapse;
const { Dragger } = Upload;

interface DocumentFormData {
  text: string;
  metadata?: string;
}

interface UpsertPanelProps {
  preselectedCollection?: string;
  onUpsertComplete?: () => void;
}

export default function UpsertPanel({ preselectedCollection, onUpsertComplete }: UpsertPanelProps = {}) {
  const [collections, setCollections] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [selectedCollection, setSelectedCollection] = useState<string>(preselectedCollection || '');
  const [form] = Form.useForm();
  const [fileList, setFileList] = useState<AntUploadFile[]>([]);
  const [fileMetadata, setFileMetadata] = useState<string>('');
  const [uploadProgress, setUploadProgress] = useState({
    visible: false,
    step: '',
    percent: 0,
    total: 0,
    current: 0,
  });

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

  const handleFileUpload = async (metadata?: string) => {
    if (!selectedCollection) {
      message.error('Please select a collection first');
      return;
    }

    if (fileList.length === 0) {
      message.error('Please select a file to upload');
      return;
    }

    setUploadLoading(true);
    setUploadProgress({
      visible: true,
      step: 'Reading file...',
      percent: 0,
      total: 0,
      current: 0,
    });

    try {
      const file = fileList[0].originFileObj;
      if (!file) {
        throw new Error('File not found');
      }

      // Parse metadata if provided
      let parsedMetadata: Record<string, any> | undefined;
      if (metadata && metadata.trim()) {
        try {
          parsedMetadata = JSON.parse(metadata);
        } catch {
          throw new Error('Invalid metadata JSON format');
        }
      }

      // Step 1: Parse file on client side
      setUploadProgress({
        visible: true,
        step: `Parsing ${file.name}...`,
        percent: 10,
        total: 0,
        current: 0,
      });
      
      const parsedDocs = await parseFile(file);

      if (parsedDocs.length === 0) {
        throw new Error('No content extracted from file');
      }

      // Step 2: Prepare documents
      setUploadProgress({
        visible: true,
        step: `Preparing ${parsedDocs.length} documents...`,
        percent: 20,
        total: parsedDocs.length,
        current: 0,
      });

      // Add file metadata to each document
      const documents: Document[] = parsedDocs.map((doc, idx) => ({
        text: doc.text,
        metadata: {
          ...doc.metadata,
          ...parsedMetadata,
          filename: file.name,
          chunk_index: idx,
        }
      }));

      // Step 3: Upload in batches to show progress
      const batchSize = 100; // Process 100 documents at a time
      const totalDocs = documents.length;
      let uploaded = 0;

      for (let i = 0; i < documents.length; i += batchSize) {
        const batch = documents.slice(i, i + batchSize);
        
        // Update progress before processing batch
        const progressPercent = 20 + Math.floor((uploaded / totalDocs) * 75);
        setUploadProgress({
          visible: true,
          step: 'Generating embeddings and upserting documents...',
          percent: progressPercent,
          total: totalDocs,
          current: uploaded,
        });

        // Upload batch
        await upsertDocuments(selectedCollection, batch);
        uploaded += batch.length;

        // Update progress after batch completes
        const newProgressPercent = 20 + Math.floor((uploaded / totalDocs) * 75);
        setUploadProgress({
          visible: true,
          step: 'Generating embeddings and upserting documents...',
          percent: newProgressPercent,
          total: totalDocs,
          current: uploaded,
        });
      }
      
      // Step 4: Complete
      setUploadProgress({
        visible: true,
        step: `Successfully uploaded ${uploaded} documents!`,
        percent: 100,
        total: uploaded,
        current: uploaded,
      });

      // Close progress modal after a short delay
      setTimeout(() => {
        setUploadProgress({ visible: false, step: '', percent: 0, total: 0, current: 0 });
      }, 1500);

      message.success(`Successfully uploaded "${file.name}" and inserted ${uploaded} document(s) into "${selectedCollection}"`);
      setFileList([]);
      setFileMetadata('');
      
      // Trigger refresh callback
      if (onUpsertComplete) {
        onUpsertComplete();
      }
    } catch (error: any) {
      setUploadProgress({ visible: false, step: '', percent: 0, total: 0, current: 0 });
      message.error(`Failed to upload file: ${error.message || error}`);
    } finally {
      setUploadLoading(false);
    }
  };

  const handleSubmit = async (values: {
    documents: DocumentFormData[];
  }) => {
    if (!selectedCollection) {
      message.error('Please select a collection first');
      return;
    }

    setLoading(true);
    try {
      const documents: Document[] = values.documents.map((doc) => ({
        text: doc.text,
        metadata: doc.metadata ? JSON.parse(doc.metadata) : undefined,
      }));

      const result = await upsertDocuments(selectedCollection, documents);
      message.success(
        `Successfully inserted ${result.inserted} document(s) into "${result.collection}"`
      );
      form.resetFields(['documents']);
      form.setFieldsValue({ documents: [{ text: '', metadata: '' }] });
      
      // Trigger refresh callback
      if (onUpsertComplete) {
        onUpsertComplete();
      }
    } catch (error) {
      message.error(`Failed to upsert documents: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (info: any) => {
    const { file } = info;
    
    // Handle file removal
    if (info.file.status === 'removed' || info.fileList.length === 0) {
      setFileList([]);
      return;
    }
    
    // Get the actual file object
    const actualFile = file.originFileObj || file;
    
    // Check file type
    const isValidType = actualFile && (
      ['application/pdf', 'text/csv', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/vnd.ms-excel', 'application/json'].includes(actualFile.type) ||
      actualFile.name.endsWith('.pdf') || actualFile.name.endsWith('.csv') || actualFile.name.endsWith('.xlsx') || actualFile.name.endsWith('.xls') || actualFile.name.endsWith('.json')
    );
    
    if (!isValidType) {
      message.error('You can only upload PDF, CSV, XLSX, or JSON files!');
      setFileList([]);
      return;
    }
    
    // Update fileList with the new file
    const fileObj: AntUploadFile = {
      uid: file.uid || `-${Date.now()}`,
      name: file.name || actualFile.name,
      status: 'done',
      originFileObj: actualFile,
    };
    
    setFileList([fileObj]);
  };

  const uploadProps = {
    accept: '.pdf,.csv,.xlsx,.xls,.json',
    fileList,
    onChange: handleFileChange,
    beforeUpload: () => false, // Prevent auto upload
    maxCount: 1, // Only allow one file
  };

  return (
    <div>
      {!preselectedCollection && (
        <Form.Item
          label="* Collection"
          rules={[{ required: true, message: 'Please select a collection' }]}
        >
          <Select
            placeholder="Select a collection"
            options={collections.map((c) => ({ label: c, value: c }))}
            showSearch
            value={selectedCollection}
            onChange={(value) => {
              setSelectedCollection(value);
            }}
          />
        </Form.Item>
      )}

      <Collapse defaultActiveKey={['1']} style={{ marginTop: 16 }}>
        <Panel header="Upload File (PDF, CSV, XLSX, JSON)" key="1">
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>File</label>
            <Dragger {...uploadProps}>
              <p className="ant-upload-drag-icon">
                <InboxOutlined />
              </p>
              <p className="ant-upload-text">Click or drag file to this area to upload</p>
              <p className="ant-upload-hint">
                Support for PDF, CSV, XLSX, and JSON files. Files will be automatically chunked and embedded.
              </p>
            </Dragger>
          </div>

          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>Metadata (JSON, optional)</label>
            <TextArea
              rows={2}
              placeholder='{"category": "example", "author": "name"}'
              value={fileMetadata}
              onChange={(e) => {
                setFileMetadata(e.target.value);
              }}
            />
            {fileMetadata && fileMetadata.trim() && (() => {
              try {
                JSON.parse(fileMetadata);
                return null;
              } catch {
                return <div style={{ color: 'red', marginTop: 4, fontSize: 12 }}>Invalid JSON format</div>;
              }
            })()}
          </div>

          <Button
            type="primary"
            onClick={() => handleFileUpload(fileMetadata)}
            loading={uploadLoading}
            icon={<UploadOutlined />}
            disabled={!selectedCollection || fileList.length === 0}
          >
            Upload and Process File
          </Button>
        </Panel>

        <Panel header="Manual Upsert" key="2">
          <Form
            form={form}
            layout="vertical"
            onFinish={handleSubmit}
            initialValues={{
              documents: [{ text: '', metadata: '' }],
            }}
          >

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
                        label="* Document Text"
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
                  disabled={!selectedCollection}
                >
                  Upsert Documents
                </Button>
                <Button onClick={() => {
                  form.resetFields(['documents']);
                  form.setFieldsValue({ documents: [{ text: '', metadata: '' }] });
                }}>
                  Reset
                </Button>
              </Space>
            </Form.Item>
          </Form>
        </Panel>
      </Collapse>

      {/* Upload Progress Modal */}
      <Modal
        open={uploadProgress.visible}
        title="Processing File"
        footer={null}
        closable={false}
        maskClosable={false}
      >
        <div style={{ padding: '20px 0' }}>
          <Progress
            percent={uploadProgress.percent}
            status={uploadProgress.percent === 100 ? 'success' : 'active'}
            strokeColor={{
              '0%': '#108ee9',
              '100%': '#87d068',
            }}
          />
          <div style={{ marginTop: 16, fontSize: 14, color: '#666' }}>
            {uploadProgress.step}
          </div>
          {uploadProgress.total > 0 && (
            <div style={{ marginTop: 8, fontSize: 12, color: '#999' }}>
              {uploadProgress.current > 0 ? `${uploadProgress.current} / ` : ''}{uploadProgress.total} documents
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
}

