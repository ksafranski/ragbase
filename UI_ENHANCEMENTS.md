# UI Enhancements - Model Management

## Overview

The UI now provides full support for managing embedding models when creating and viewing collections.

## Features

### 1. Model Selection During Collection Creation

When creating a new collection, users can now:

- **Select an Embedding Model**: Choose from available models loaded in the backend
  - See model descriptions and dimensions
  - Default model is pre-selected
  - Each model shows whether it's the default

- **Choose Distance Metric**: Select how similarity is calculated
  - **Cosine** (recommended): Measures angle between vectors
  - **Euclidean**: Measures straight-line distance
  - **Dot Product**: Fast, good for normalized vectors

- **See Warning**: Clear alert about model immutability
  - "Once created, a collection's embedding model cannot be changed"

### 2. Enhanced Collection Cards

Collection cards now display:

- **Embedding Model Name**: Prominently displayed with robot icon
- **Vector Count**: Total number of vectors stored
- **Vector Dimension**: Size of each vector (e.g., "384d")
- **Distance Metric**: The similarity calculation method

### 3. Improved Collection Browser

The collection detail modal now features:

- **Prominent Model Header**: 
  - Large, gradient-styled card at the top
  - Shows embedding model, dimensions, and distance metric
  - "Immutable" badge to remind users model can't be changed

- **Key Statistics**:
  - Total Vectors
  - Indexed Vectors
  - Points Count
  - Status

- **Advanced Configuration**:
  - Segments count
  - Indexing threshold
  - Optimizer status

## User Experience Flow

### Creating a Collection

1. Click "Create Collection"
2. Enter collection name
3. See warning about model immutability
4. Select embedding model (or use default)
5. Select distance metric (or use cosine)
6. Click "Create"
7. Success message shows which model and dimension was used

### Viewing Collections

1. Collection cards show model info at a glance
2. Click any collection card to view details
3. Model information is prominently displayed in purple gradient header
4. All configuration details visible in organized sections

## API Integration

### New Functions Used

- `listModels()`: Fetches available embedding models from backend
- `createCollection(name, model, distance)`: Creates collection with specific model
- `getCollectionInfo()`: Now returns model name and all configuration

### Updated Components

- **CollectionsPanel.tsx**: Complete redesign with model support
- **api.ts**: Added `listModels()` function and updated `createCollection()`

## Visual Design

### Color Scheme

- **Model Header**: Purple gradient (`#667eea` to `#764ba2`)
- **Model Icon**: Purple (`#722ed1`)
- **Vectors**: Blue tags
- **Dimensions**: Cyan tags
- **Distance**: Purple tags
- **Status**: Green tags

### Icons

- **RobotOutlined**: Embedding models
- **DatabaseOutlined**: Collections and vectors
- **InfoCircleOutlined**: Warnings and tips

## Key Benefits

1. **Transparency**: Users always know which model a collection uses
2. **Safety**: Clear warnings about model immutability
3. **Flexibility**: Easy to choose different models for different use cases
4. **Visibility**: Model information is prominent and always visible
5. **Education**: Descriptions help users understand model tradeoffs

## Screenshots

### Create Collection Modal
- Shows model selection dropdown with descriptions
- Warning banner about immutability
- Distance metric options

### Collection Cards
- Compact display of key info
- Model name, vector count, dimension, distance

### Collection Browser
- Large purple header with model details
- "Immutable" badge
- All statistics and configuration in organized layout

